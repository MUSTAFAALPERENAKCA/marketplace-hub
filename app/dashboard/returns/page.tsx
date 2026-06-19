import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, returnRequests } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { SyncButton } from "@/components/dashboard/sync-button";
import { ReturnRequestCard } from "@/components/dashboard/return-request-card";

const STATUS_ORDER: Record<string, number> = {
  onay_bekliyor: 0,
  talep_edildi: 1,
  onaylandi: 2,
  reddedildi: 3,
};

export default async function ReturnsPage() {
  const orgId = await requireOrgId();

  const rows = await db
    .select({
      id: returnRequests.id,
      provider: returnRequests.provider,
      reason: returnRequests.reason,
      status: returnRequests.status,
      requestedAt: returnRequests.requestedAt,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
    })
    .from(returnRequests)
    .leftJoin(orders, eq(returnRequests.orderId, orders.id))
    .where(eq(returnRequests.orgId, orgId))
    .orderBy(desc(returnRequests.requestedAt));

  const sorted = [...rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const pendingCount = rows.filter((r) => r.status === "onay_bekliyor").length;

  return (
    <div>
      <Header
        title="İade & İptal"
        description={
          pendingCount > 0
            ? `${pendingCount} talep senin onayını bekliyor`
            : "Tüm talepler değerlendirildi"
        }
        actions={<SyncButton />}
      />
      <div className="space-y-4 p-8">
        {sorted.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">
            Henüz iade/iptal talebi yok. &quot;Yenile&quot; butonuyla pazaryerlerinden veri çekebilirsin.
          </p>
        )}
        {sorted.map((request) => (
          <ReturnRequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}
