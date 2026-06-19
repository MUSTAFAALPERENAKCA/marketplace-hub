import "dotenv/config";
import { db } from "./index";
import { marketplaceConnections, organizations } from "./schema";
import { marketplaceProviders } from "../lib/marketplaces/types";
import { syncMarketplaceData } from "../lib/marketplaces/sync";

async function main() {
  const orgId = process.argv[2];
  if (!orgId) {
    console.error("Kullanım: npm run db:seed -- <clerk-org-id>");
    console.error("Clerk org id'sini Clerk dashboard'dan veya onboarding sonrası /onboarding akışından alabilirsin.");
    process.exit(1);
  }

  await db
    .insert(organizations)
    .values({ id: orgId, name: "Demo Mağaza" })
    .onConflictDoNothing();

  for (const provider of marketplaceProviders) {
    await db.insert(marketplaceConnections).values({
      orgId,
      provider,
      status: "bagli",
      lastSyncedAt: new Date(),
    });

    const result = await syncMarketplaceData(orgId, provider);
    console.log(
      `${provider}: ${result.ordersCount} sipariş, ${result.reviewsCount} yorum, ${result.returnsCount} iade talebi eklendi`
    );
  }

  console.log("Seed tamamlandı.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
