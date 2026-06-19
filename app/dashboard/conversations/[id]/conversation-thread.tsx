"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendHumanReply } from "../actions";

export interface ThreadMessage {
  id: string;
  sender: "musteri" | "ai" | "insan";
  content: string;
  createdAt: Date;
}

const SENDER_LABELS: Record<ThreadMessage["sender"], string> = {
  musteri: "Müşteri",
  ai: "AI",
  insan: "Sen",
};

export function ConversationThread({
  conversationId,
  initialMessages,
}: {
  conversationId: string;
  initialMessages: ThreadMessage[];
}) {
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex h-[calc(100vh-89px)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-8">
        {initialMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "musteri" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[60%] rounded-lg px-3 py-2 text-sm ${
                message.sender === "musteri"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <p className="mb-1 text-xs opacity-70">{SENDER_LABELS[message.sender]}</p>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t p-4">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Manuel yanıt yaz..."
          rows={2}
        />
        <Button
          disabled={isPending || reply.trim().length === 0}
          onClick={() =>
            startTransition(async () => {
              await sendHumanReply(conversationId, reply);
              setReply("");
              toast.success("Yanıt gönderildi");
            })
          }
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
