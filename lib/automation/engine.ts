import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { automationActions, returnRequests } from "@/db/schema";
import { getAdapter } from "@/lib/marketplaces/registry";

const HIGH_RISK_KEYWORDS = [
  "kalite",
  "hayal kırıklığı",
  "hasarlı",
  "param",
  "gecikti",
  "kötü",
  "şikayet",
];

function isHighRisk(reason: string): boolean {
  const lower = reason.toLowerCase();
  return HIGH_RISK_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * Hibrit otomasyon: standart iade sebepleri otomatik onaylanır, şikayet
 * dili içeren talepler insan onayına düşer. Her karar automation_actions'a
 * loglanır — otomasyonun ne yaptığı her zaman panelden görülebilir.
 */
export async function evaluateNewReturnRequests(orgId: string) {
  const pending = await db
    .select()
    .from(returnRequests)
    .where(and(eq(returnRequests.orgId, orgId), eq(returnRequests.status, "talep_edildi")));

  for (const request of pending) {
    if (isHighRisk(request.reason)) {
      await db
        .update(returnRequests)
        .set({ status: "onay_bekliyor" })
        .where(eq(returnRequests.id, request.id));

      await db.insert(automationActions).values({
        orgId,
        actionType: "approve_return",
        source: "ai",
        status: "pending_approval",
        targetType: "return_request",
        targetId: request.id,
        reasoning:
          "Müşteri açıklamasında şikayet/kalite sorunu ifadeleri tespit edildi, bu yüzden otomatik onaylanmadı.",
        payload: { reason: request.reason },
      });
    } else {
      const adapter = getAdapter(request.provider);
      await adapter.approveReturn(request.externalId);

      await db
        .update(returnRequests)
        .set({ status: "onaylandi", decidedAt: new Date() })
        .where(eq(returnRequests.id, request.id));

      await db.insert(automationActions).values({
        orgId,
        actionType: "approve_return",
        source: "ai",
        status: "completed",
        targetType: "return_request",
        targetId: request.id,
        reasoning: "Standart iade sebebi (beden/değişim), otomatik onaylandı.",
        payload: { reason: request.reason },
      });
    }
  }
}
