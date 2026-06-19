import { eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { marketplaceConnections } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { marketplaceProviders, type MarketplaceProvider } from "@/lib/marketplaces/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { connectAllAndContinue, connectProvider } from "./actions";

const PROVIDER_LABELS: Record<MarketplaceProvider, string> = {
  trendyol: "Trendyol",
  amazon: "Amazon",
  hepsiburada: "Hepsiburada",
};

export default async function ConnectMarketplacesPage() {
  const orgId = await requireOrgId();
  const connections = await db
    .select({ provider: marketplaceConnections.provider })
    .from(marketplaceConnections)
    .where(eq(marketplaceConnections.orgId, orgId));
  const connected = new Set(connections.map((c) => c.provider));

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-semibold">Pazaryerlerini bağla</h1>
        <p className="text-muted-foreground">
          Gerçek API anahtarın olmasa da mock veriyle devam edebilirsin;
          ileride gerçek hesabınla 1:1 değiştirilir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {marketplaceProviders.map((provider) => {
          const isConnected = connected.has(provider);
          return (
            <Card key={provider}>
              <CardHeader>
                <CardTitle>{PROVIDER_LABELS[provider]}</CardTitle>
                <CardDescription>
                  {isConnected ? "Bağlandı (mock)" : "Henüz bağlı değil"}
                </CardDescription>
              </CardHeader>
              <CardContent />
              <CardFooter>
                {isConnected ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Bağlandı
                  </div>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await connectProvider(provider);
                    }}
                    className="w-full"
                  >
                    <Button type="submit" variant="outline" className="w-full">
                      Bağla (mock)
                    </Button>
                  </form>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <form action={connectAllAndContinue} className="mt-10 flex justify-center">
        <Button type="submit" size="lg">
          Tümünü bağla ve panele geç
        </Button>
      </form>
    </div>
  );
}
