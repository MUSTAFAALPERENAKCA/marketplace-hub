"use client";

import { useState, useTransition } from "react";
import { Sparkles, Star, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProviderBadge } from "@/components/dashboard/provider-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { generateAiSuggestion, sendReviewReply } from "@/app/dashboard/reviews/actions";
import type { MarketplaceProvider } from "@/lib/marketplaces/types";

export interface ReviewCardData {
  id: string;
  provider: MarketplaceProvider;
  productName: string;
  rating: number;
  comment: string;
  customerName: string | null;
  status: "yeni" | "yanitlandi";
  aiSuggestedReply: string | null;
  repliedText: string | null;
}

export function ReviewCard({ review }: { review: ReviewCardData }) {
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState(review.aiSuggestedReply ?? "");
  const [syncedSuggestion, setSyncedSuggestion] = useState(review.aiSuggestedReply);

  if (review.aiSuggestedReply !== syncedSuggestion) {
    setSyncedSuggestion(review.aiSuggestedReply);
    setDraft(review.aiSuggestedReply ?? "");
  }

  const isReplied = review.status === "yanitlandi";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ProviderBadge provider={review.provider} />
            <StatusBadge status={review.status} />
          </div>
          <p className="mt-2 font-medium">{review.productName}</p>
          <p className="text-sm text-muted-foreground">{review.customerName ?? "Anonim müşteri"}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{review.comment}</p>

        {isReplied ? (
          <div className="rounded-md bg-secondary/50 p-3 text-sm">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Yanıtınız</p>
            {review.repliedText}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Yanıtı buraya yaz veya AI önerisi oluştur..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await generateAiSuggestion(review.id);
                  })
                }
              >
                <Sparkles className="h-4 w-4" />
                AI önerisi oluştur
              </Button>
              <Button
                size="sm"
                disabled={isPending || draft.trim().length === 0}
                onClick={() =>
                  startTransition(async () => {
                    const source = draft === review.aiSuggestedReply ? "ai" : "human";
                    await sendReviewReply(review.id, draft, source);
                    toast.success("Yanıt gönderildi");
                  })
                }
              >
                <Send className="h-4 w-4" />
                Gönder
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
