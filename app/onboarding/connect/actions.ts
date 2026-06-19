"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { marketplaceConnections } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { syncMarketplaceData } from "@/lib/marketplaces/sync";
import { evaluateNewReturnRequests } from "@/lib/automation/engine";
import { marketplaceProviders, type MarketplaceProvider } from "@/lib/marketplaces/types";

export async function connectProvider(provider: MarketplaceProvider) {
  const orgId = await requireOrgId();

  await db.insert(marketplaceConnections).values({
    orgId,
    provider,
    status: "bagli",
    lastSyncedAt: new Date(),
  });

  await syncMarketplaceData(orgId, provider);
  await evaluateNewReturnRequests(orgId);
  revalidatePath("/onboarding/connect");
}

export async function connectAllAndContinue() {
  const orgId = await requireOrgId();

  const connected = await db
    .select({ provider: marketplaceConnections.provider })
    .from(marketplaceConnections)
    .where(eq(marketplaceConnections.orgId, orgId));
  const connectedProviders = new Set(connected.map((c) => c.provider));

  for (const provider of marketplaceProviders) {
    if (connectedProviders.has(provider)) continue;
    await connectProvider(provider);
  }

  redirect("/dashboard");
}
