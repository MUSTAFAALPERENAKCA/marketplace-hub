import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { SyncButton } from "@/components/dashboard/sync-button";
import { ProviderBadge } from "@/components/dashboard/provider-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatPrice(price: string | null, currency: string | null) {
  if (!price) return "—";
  return `${Number(price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency ?? "TRY"}`;
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function OrdersPage() {
  const orgId = await requireOrgId();

  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.orgId, orgId))
    .orderBy(desc(orders.placedAt));

  return (
    <div>
      <Header
        title="Siparişler"
        description={`${orderRows.length} sipariş — Trendyol, Amazon ve Hepsiburada toplamı`}
        actions={<SyncButton />}
      />
      <div className="p-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sipariş No</TableHead>
              <TableHead>Pazaryeri</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tutar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Kargo</TableHead>
              <TableHead>Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Henüz sipariş yok. &quot;Yenile&quot; butonuyla pazaryerlerinden veri çekebilirsin.
                </TableCell>
              </TableRow>
            )}
            {orderRows.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/dashboard/orders/${order.id}`} className="font-medium hover:underline">
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <ProviderBadge provider={order.provider} />
                </TableCell>
                <TableCell>{order.customerEmail ?? order.customerPhone ?? "—"}</TableCell>
                <TableCell>{formatPrice(order.totalPrice, order.currency)}</TableCell>
                <TableCell>
                  <StatusBadge status={order.fulfillmentStatus} />
                </TableCell>
                <TableCell>
                  {order.trackingCompany ? `${order.trackingCompany} · ${order.trackingNumber}` : "—"}
                </TableCell>
                <TableCell>{formatDate(order.placedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
