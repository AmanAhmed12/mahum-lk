import { NextResponse } from "next/server";
import { z } from "zod";
import type { Content, Part } from "@google/genai";

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

    await prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: "USER", content: input.message },
    });

    const history = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
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
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: chatTools },
    });

    let response = await chat.sendMessage({ message: input.message });
    let rounds = 0;

    while (response.functionCalls && response.functionCalls.length > 0 && rounds < MAX_TOOL_ROUNDS) {
      const responseParts: Part[] = [];
      for (const call of response.functionCalls) {
        if (call.name === "lookupOrderStatus") {
          const orderId = String(call.args?.orderId ?? "");
          const result = orderId
            ? await lookupOrderStatus(orderId, user?.customerProfileId ?? null)
            : { error: "No order ID was provided." };
          responseParts.push({ functionResponse: { name: call.name, response: result } });
        } else {
          responseParts.push({
            functionResponse: { name: call.name ?? "unknown", response: { error: "Unknown tool." } },
          });
        }
      }
      response = await chat.sendMessage({ message: responseParts });
      rounds += 1;
    }

    const replyText = response.text?.trim() || "Sorry, I couldn't generate a response. Please try again.";

    await prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: replyText },
    });

    return NextResponse.json({ conversationId: conversation.id, reply: replyText });
  } catch (error) {
    return handleApiError(error);
  }
}
