import { eq } from "drizzle-orm";
import { db } from "@/db";
import { marketplaceConnections } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ProviderBadge } from "@/components/dashboard/provider-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDate(date: Date | null) {
  if (!date) return "Henüz senkronize edilmedi";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function SettingsPage() {
  const orgId = await requireOrgId();

  const connections = await db
    .select()
    .from(marketplaceConnections)
    .where(eq(marketplaceConnections.orgId, orgId));

  return (
    <div>
      <Header title="Ayarlar" description="Pazaryeri bağlantıları" />
      <div className="grid gap-4 p-8 sm:grid-cols-3">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                <ProviderBadge provider={connection.provider} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Durum: {connection.status === "bagli" ? "Bağlı (mock)" : connection.status}</p>
              <p>Son senkronizasyon: {formatDate(connection.lastSyncedAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="px-8 pb-8 text-sm text-muted-foreground">
        Org id: <code>{orgId}</code> — web chat widget&apos;ı test etmek için{" "}
        <code>/chat-widget?org={orgId}</code> adresini kullanabilirsin.
      </p>
    </div>
  );
}
