import "server-only";

import { FunctionCallingConfigMode, GoogleGenAI, Type, type FunctionDeclaration } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

let client: GoogleGenAI | null = null;

/** Lazily creates the Gemini client so a missing API key only errors when the chatbot is actually used. */
export function getGeminiClient(): GoogleGenAI {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Copy .env.example to .env and fill it in.");
  }
  if (!client) {
    client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        // The SDK retries 429/5xx up to 5x with exponential backoff by
        // default (can take 60s+ to finally surface an error). We want a
        // snappy chatbot, so we fail fast here and handle a single retry
        // ourselves at the call site (see isRetryableGeminiError in
        // app/api/chat/route.ts) instead of stacking two retry policies.
        timeout: 15_000,
        retryOptions: { attempts: 1 },
      },
    });
  }
  return client;
}

export const SYSTEM_INSTRUCTION = `You are "Mahum Assistant", the friendly shopping and tailoring assistant for Mahum.lk — an online store that sells sewing, craft and fashion accessories, and also offers custom tailoring services (shirts, trousers, suits, alterations).

Your job:
- Help visitors find products and understand categories.
- Explain how to request a custom tailoring order: the customer chooses a service, provides body measurements (or reuses a saved measurement profile), an address and a payment method.
- Explain order statuses in plain language: PENDING (received, not yet confirmed), CONFIRMED (accepted by the shop), IN_PROGRESS (being made/prepared), READY (ready for delivery/pickup), DELIVERED (completed), CANCELLED.
- If a signed-in customer asks about one of their own orders and gives an order ID, call the "lookupOrderStatus" tool to get the real status. Never guess or invent an order status.
- Never invent prices, stock levels, or policies. If you don't know, say so and suggest the visitor browse the shop or contact support.
- Be concise, warm and helpful. Use short paragraphs or bullet points.`;

export const lookupOrderStatusDeclaration: FunctionDeclaration = {
  name: "lookupOrderStatus",
  description:
    "Looks up the current status, payment status and delivery status of an order belonging to the signed-in customer.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderId: {
        type: Type.STRING,
        description: "The order ID the customer is asking about.",
      },
    },
    required: ["orderId"],
  },
};

export const chatTools = [{ functionDeclarations: [lookupOrderStatusDeclaration] }];
export { FunctionCallingConfigMode };
