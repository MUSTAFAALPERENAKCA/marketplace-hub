"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { automationActions, returnRequests } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { getAdapter } from "@/lib/marketplaces/registry";

async function getOwnedReturn(orgId: string, returnId: string) {
  const [request] = await db
    .select()
    .from(returnRequests)
    .where(and(eq(returnRequests.id, returnId), eq(returnRequests.orgId, orgId)))
    .limit(1);
  return request;
}

async function resolvePendingAutomationAction(
  returnId: string,
  status: "approved" | "rejected",
  userId: string | null,
  extraPayload?: Record<string, unknown>
) {
  await db
    .update(automationActions)
    .set({ status, decidedAt: new Date(), decidedByUserId: userId, ...(extraPayload && { payload: extraPayload }) })
    .where(
      and(
        eq(automationActions.targetType, "return_request"),
        eq(automationActions.targetId, returnId),
        eq(automationActions.status, "pending_approval")
      )
    );
}

export async function approveReturnRequest(returnId: string) {
  const orgId = await requireOrgId();
  const { userId } = await auth();
  const request = await getOwnedReturn(orgId, returnId);
  if (!request) return;

  const adapter = getAdapter(request.provider);
  await adapter.approveReturn(request.externalId);

  await db
    .update(returnRequests)
    .set({ status: "onaylandi", decidedAt: new Date(), decidedByUserId: userId })
    .where(eq(returnRequests.id, returnId));

  await resolvePendingAutomationAction(returnId, "approved", userId);

  revalidatePath("/dashboard/returns");
  revalidatePath("/dashboard/automation");
}

export async function rejectReturnRequest(returnId: string, reason: string) {
  const orgId = await requireOrgId();
  const { userId } = await auth();
  const request = await getOwnedReturn(orgId, returnId);
  if (!request) return;

  const adapter = getAdapter(request.provider);
  await adapter.rejectReturn(request.externalId, reason);

  await db
    .update(returnRequests)
    .set({ status: "reddedildi", decidedAt: new Date(), decidedByUserId: userId })
    .where(eq(returnRequests.id, returnId));

  await resolvePendingAutomationAction(returnId, "rejected", userId, { reddedilmeSebebi: reason });

  revalidatePath("/dashboard/returns");
  revalidatePath("/dashboard/automation");
}
