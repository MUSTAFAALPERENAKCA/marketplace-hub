"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  sender: "musteri" | "ai" | "insan";
  content: string;
  createdAt: string;
}

function getSessionId() {
  if (typeof window === "undefined") return "";
  let sessionId = window.localStorage.getItem("chat-widget-session-id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.localStorage.setItem("chat-widget-session-id", sessionId);
  }
  return sessionId;
}

export function ChatWidget() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org") ?? "";
  const [sessionId] = useState(() => getSessionId());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orgId || !sessionId) return;
    fetch(`/api/chat-widget/message?orgId=${orgId}&sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setChatMessages(data.messages ?? []));
  }, [orgId, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function sendMessage() {
    if (!input.trim() || !orgId || !sessionId) return;
    const text = input;
    setInput("");
    setIsSending(true);
    setChatMessages((prev) => [
      ...prev,
      { sender: "musteri", content: text, createdAt: new Date().toISOString() },
    ]);

    const res = await fetch("/api/chat-widget/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, sessionId, message: text }),
    });
    const data = await res.json();
    setChatMessages(data.messages ?? []);
    setIsSending(false);
  }

  if (!orgId) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Bu widget&apos;ı kullanmak için ?org=&lt;organizasyon-id&gt; parametresi gerekli.
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="border-b px-4 py-3">
        <p className="font-semibold">Müşteri Desteği</p>
        <p className="text-xs text-muted-foreground">Genelde hemen yanıtlıyoruz</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {chatMessages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Merhaba! Sipariş durumu, iade talebi veya başka bir konuda yardımcı olabilirim.
          </p>
        )}
        {chatMessages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === "musteri" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.sender === "musteri"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Bir mesaj yaz..."
          disabled={isSending}
        />
        <Button onClick={sendMessage} disabled={isSending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
