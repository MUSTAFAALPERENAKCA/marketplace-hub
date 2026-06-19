"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { marketplaceConnections } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { syncMarketplaceData } from "@/lib/marketplaces/sync";
import { evaluateNewReturnRequests } from "@/lib/automation/engine";

/** Org'a bağlı tüm pazaryerlerinden yeni veri çeker. */
export async function syncAllConnectedMarketplaces() {
  const orgId = await requireOrgId();

  const connections = await db
    .select({ provider: marketplaceConnections.provider })
    .from(marketplaceConnections)
    .where(eq(marketplaceConnections.orgId, orgId));

  for (const connection of connections) {
    await syncMarketplaceData(orgId, connection.provider);
  }

  await evaluateNewReturnRequests(orgId);

  await db
    .update(marketplaceConnections)
    .set({ lastSyncedAt: new Date() })
    .where(eq(marketplaceConnections.orgId, orgId));

  revalidatePath("/dashboard", "layout");
}
