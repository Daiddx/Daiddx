"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { ChatMessage, ExtractionResult, SaveExtractionPayload } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ConfirmExtractionCard } from "@/components/ConfirmExtractionCard";

interface ConversationPanelProps {
  onSaved: () => void;
}

export function ConversationPanel({ onSaved }: ConversationPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingExtraction, setPendingExtraction] = useState<{
    extraction: ExtractionResult;
    rawInput: string;
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const response = await fetch("/api/chat");
    const data = (await response.json()) as { messages: ChatMessage[] };
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialMessages() {
      const response = await fetch("/api/chat");
      const data = (await response.json()) as { messages: ChatMessage[] };
      if (!cancelled) {
        setMessages(data.messages ?? []);
      }
    }

    void loadInitialMessages();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingExtraction]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading) {
      return;
    }

    const message = input.trim();
    setInput("");
    setLoading(true);
    setPendingExtraction(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, action: "extract" }),
      });

      const data = (await response.json()) as {
        messages: ChatMessage[];
        extraction: ExtractionResult;
      };

      setMessages(data.messages);
      if (data.extraction.event || data.extraction.preferences.length > 0) {
        setPendingExtraction({
          extraction: data.extraction,
          rawInput: message,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(payload: SaveExtractionPayload) {
    setLoading(true);
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", payload }),
      });
      setPendingExtraction(null);
      await loadMessages();
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex h-full min-h-[560px] flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">Conversation</h2>
        <p className="text-sm text-zinc-500">
          Describe a chat, birthday, or preference naturally. I&apos;ll extract the details.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
            Example: &quot;Talked with Lisa today — her birthday is April 3, she loves sci-fi
            books and oat milk lattes.&quot;
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6",
              message.role === "user"
                ? "ml-auto bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-800",
            )}
          >
            {message.content}
          </div>
        ))}

        {pendingExtraction && (
          <ConfirmExtractionCard
            extraction={pendingExtraction.extraction}
            rawInput={pendingExtraction.rawInput}
            loading={loading}
            onConfirm={handleConfirm}
            onDismiss={() => setPendingExtraction(null)}
          />
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-4">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="min-h-[52px] flex-1 resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none ring-zinc-900 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </section>
  );
}
