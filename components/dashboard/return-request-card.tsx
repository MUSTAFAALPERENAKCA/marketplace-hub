"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProviderBadge } from "@/components/dashboard/provider-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { approveReturnRequest, rejectReturnRequest } from "@/app/dashboard/returns/actions";
import type { MarketplaceProvider } from "@/lib/marketplaces/types";

export interface ReturnRequestCardData {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  provider: MarketplaceProvider;
  reason: string;
  status: "talep_edildi" | "onay_bekliyor" | "onaylandi" | "reddedildi";
}

export function ReturnRequestCard({ request }: { request: ReturnRequestCardData }) {
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const needsDecision = request.status === "onay_bekliyor";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ProviderBadge provider={request.provider} />
            <StatusBadge status={request.status} />
          </div>
          {request.orderId && request.orderNumber && (
            <Link
              href={`/dashboard/orders/${request.orderId}`}
              className="mt-2 block text-sm font-medium hover:underline"
            >
              {request.orderNumber}
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{request.reason}</p>

        {needsDecision && (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              Şikayet dili tespit edildi — AI otomatik onaylamadı, kararı sen ver.
            </p>
            {showReject && (
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reddetme sebebi..."
                rows={2}
              />
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await approveReturnRequest(request.id);
                    toast.success("İade onaylandı");
                  })
                }
              >
                <Check className="h-4 w-4" />
                Onayla
              </Button>
              {showReject ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isPending || rejectReason.trim().length === 0}
                  onClick={() =>
                    startTransition(async () => {
                      await rejectReturnRequest(request.id, rejectReason);
                      toast.success("İade reddedildi");
                    })
                  }
                >
                  Reddi onayla
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowReject(true)}>
                  <X className="h-4 w-4" />
                  Reddet
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
