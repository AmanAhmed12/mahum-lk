"use client";

import * as React from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "mahum-chat-conversation-id";
const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm the Mahum Assistant. Ask me about our products, tailoring services, or type an order ID to check its status.",
};

export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const conversationIdRef = React.useRef<string | undefined>(undefined);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      conversationIdRef.current = sessionStorage.getItem(STORAGE_KEY) || undefined;
    } catch {
      conversationIdRef.current = undefined;
    }
  }, []);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsSending(true);

    try {
      const data = await apiJson<{ conversationId: string; reply: string }>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ conversationId: conversationIdRef.current, message: text }),
      });
      conversationIdRef.current = data.conversationId;
      try {
        sessionStorage.setItem(STORAGE_KEY, data.conversationId);
      } catch {
        // sessionStorage may be unavailable (e.g. privacy mode) — safe to ignore.
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? `Sorry, something went wrong: ${error.message}`
              : "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-border-muted bg-white shadow-xl">
          <div className="flex items-center justify-between bg-brand-600 px-4 py-3 text-white">
            <p className="text-sm font-semibold">Mahum Assistant</p>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <p
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-surface-muted text-foreground",
                  )}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {isSending ? (
              <div className="flex justify-start">
                <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-neutral-500">
                  Typing…
                </p>
              </div>
            ) : null}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border-muted p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
            />
            <Button type="submit" size="icon" isLoading={isSending} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700"
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
