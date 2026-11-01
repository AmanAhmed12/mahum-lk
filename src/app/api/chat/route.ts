import { z } from "zod";
import type { Content, FunctionCall, Part } from "@google/genai";

import { handleApiError } from "@/lib/api/errors";
import { getCurrentUser } from "@/lib/auth/session";
import { CHAT_MODEL, chatTools, getGeminiClient, SYSTEM_INSTRUCTION } from "@/lib/gemini";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().trim().min(1).max(2000),
});

const MAX_HISTORY_MESSAGES = 20;
const MAX_TOOL_ROUNDS = 3;

async function lookupOrderStatus(orderId: string, customerProfileId: string | null) {
  if (!customerProfileId) {
    return { error: "The visitor is not signed in, so no order details can be looked up." };
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true, delivery: true },
  });
  if (!order || order.customerId !== customerProfileId) {
    return { error: "No order with that ID was found for this customer." };
  }
  return {
    orderId: order.id,
    type: order.type,
    status: order.status,
    paymentStatus: order.payment?.status ?? "UNKNOWN",
    deliveryStatus: order.delivery?.status ?? "UNKNOWN",
    totalAmount: Number(order.totalAmount),
  };
}

function isRetryableGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /"code":\s*(503|429)|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(message);
}

async function resolveFunctionCalls(calls: FunctionCall[], customerProfileId: string | null): Promise<Part[]> {
  const parts: Part[] = [];
  for (const call of calls) {
    if (call.name === "lookupOrderStatus") {
      const orderId = String(call.args?.orderId ?? "");
      const result = orderId
        ? await lookupOrderStatus(orderId, customerProfileId)
        : { error: "No order ID was provided." };
      parts.push({ functionResponse: { name: call.name, response: result } });
    } else {
      parts.push({
        functionResponse: { name: call.name ?? "unknown", response: { error: "Unknown tool." } },
      });
    }
  }
  return parts;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = chatRequestSchema.parse(body);

    const user = await getCurrentUser();

    let conversation = input.conversationId
      ? await prisma.chatConversation.findUnique({ where: { id: input.conversationId } })
      : null;

    if (!conversation || (conversation.userId && conversation.userId !== user?.id)) {
      conversation = await prisma.chatConversation.create({ data: { userId: user?.id ?? null } });
    }
    const conversationId = conversation.id;

    await prisma.chatMessage.create({
      data: { conversationId, role: "USER", content: input.message },
    });

    const history = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: MAX_HISTORY_MESSAGES,
    });

    const priorHistory: Content[] = history
      .slice(0, -1) // exclude the message we are about to send
      .map((m) => ({
        role: m.role === "USER" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    const ai = getGeminiClient();
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      history: priorHistory,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: chatTools, maxOutputTokens: 512 },
    });

    const encoder = new TextEncoder();
    let assistantText = "";

    async function runTurn(controller: ReadableStreamDefaultController<Uint8Array>) {
      let streamResult = await chat.sendMessageStream({ message: input.message });
      let rounds = 0;

      while (true) {
        const pendingCalls: FunctionCall[] = [];

        for await (const chunk of streamResult) {
          if (chunk.functionCalls?.length) {
            pendingCalls.push(...chunk.functionCalls);
          }
          if (chunk.text) {
            assistantText += chunk.text;
            safeEnqueue(controller, chunk.text);
          }
        }

        if (pendingCalls.length === 0 || rounds >= MAX_TOOL_ROUNDS) break;

        const responseParts = await resolveFunctionCalls(pendingCalls, user?.customerProfileId ?? null);
        rounds += 1;
        streamResult = await chat.sendMessageStream({ message: responseParts });
      }
    }

    let clientDisconnected = false;
    let streamClosed = false;

    function safeEnqueue(controller: ReadableStreamDefaultController<Uint8Array>, text: string) {
      if (clientDisconnected || streamClosed) return;
      try {
        controller.enqueue(encoder.encode(text));
      } catch {
        // The client may have disconnected between our check and this call —
        // harmless, there is simply no one left to receive the bytes.
        clientDisconnected = true;
      }
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          try {
            await runTurn(controller);
          } catch (error) {
            // The model backend can be transiently overloaded (503) or rate
            // limited (429) — both are worth a single quick retry before
            // giving up, since nothing has been streamed to the user yet.
            if (!assistantText && !clientDisconnected && isRetryableGeminiError(error)) {
              await runTurn(controller);
            } else {
              throw error;
            }
          }
        } catch (error) {
          if (!clientDisconnected) console.error("Gemini streaming error:", error);
          if (!assistantText) {
            safeEnqueue(controller, "Sorry, I'm having trouble responding right now. Please try again shortly.");
          }
        } finally {
          if (!streamClosed) {
            streamClosed = true;
            try {
              controller.close();
            } catch {
              // Already closed/cancelled by the runtime — nothing to do.
            }
          }
          const finalText = assistantText.trim() || "Sorry, I couldn't generate a response. Please try again.";
          prisma.chatMessage
            .create({ data: { conversationId, role: "ASSISTANT", content: finalText } })
            .catch((error) => console.error("Failed to persist assistant chat message:", error));
        }
      },
      cancel() {
        // The client navigated away or aborted the request mid-stream.
        clientDisconnected = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Conversation-Id": conversationId,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
