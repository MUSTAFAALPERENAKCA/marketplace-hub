import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ProviderBadge } from "@/components/dashboard/provider-badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatPrice(price: string | number | null, currency: string | null) {
  if (price === null) return "—";
  return `${Number(price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${currency ?? "TRY"}`;
}

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await requireOrgId();

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.orgId, orgId)))
    .limit(1);

  if (!order) {
    notFound();
  }

  return (
    <div>
      <Header
        title={order.orderNumber}
        description="Sipariş detayı"
      />
      <div className="grid gap-6 p-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ürünler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.itemsJson?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} adet{item.variant ? ` · ${item.variant}` : ""}
                  </p>
                </div>
                <p className="font-medium">{formatPrice(item.price, order.currency)}</p>
              </div>
            ))}
            {(!order.itemsJson || order.itemsJson.length === 0) && (
              <p className="text-sm text-muted-foreground">Ürün bilgisi yok.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pazaryeri</span>
                <ProviderBadge provider={order.provider} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Kargo durumu</span>
                <StatusBadge status={order.fulfillmentStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ödeme durumu</span>
                <StatusBadge status={order.financialStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Toplam</span>
                <span className="font-medium">{formatPrice(order.totalPrice, order.currency)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Müşteri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{order.customerEmail ?? "—"}</p>
              <p className="text-muted-foreground">{order.customerPhone ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kargo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{order.trackingCompany ?? "Henüz kargoya verilmedi"}</p>
              <p className="text-muted-foreground">{order.trackingNumber ?? "—"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zaman çizelgesi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sipariş</span>
                <span>{formatDate(order.placedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kargoya verildi</span>
                <span>{formatDate(order.shippedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teslim edildi</span>
                <span>{formatDate(order.deliveredAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
