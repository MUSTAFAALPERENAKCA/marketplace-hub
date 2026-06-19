"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { automationActions, reviews } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { suggestReviewReply } from "@/lib/ai/review-reply";
import { getAdapter } from "@/lib/marketplaces/registry";

async function getOwnedReview(orgId: string, reviewId: string) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.orgId, orgId)))
    .limit(1);
  return review;
}

export async function generateAiSuggestion(reviewId: string) {
  const orgId = await requireOrgId();
  const review = await getOwnedReview(orgId, reviewId);
  if (!review) return;

  const suggestion = await suggestReviewReply(review);

  await db
    .update(reviews)
    .set({ aiSuggestedReply: suggestion })
    .where(eq(reviews.id, reviewId));

  revalidatePath("/dashboard/reviews");
}

export async function sendReviewReply(
  reviewId: string,
  text: string,
  source: "ai" | "human"
) {
  const orgId = await requireOrgId();
  const review = await getOwnedReview(orgId, reviewId);
  if (!review) return;

  const adapter = getAdapter(review.provider);
  await adapter.replyToReview(review.externalId, text);

  await db
    .update(reviews)
    .set({ status: "yanitlandi", repliedText: text, repliedAt: new Date() })
    .where(eq(reviews.id, reviewId));

  await db.insert(automationActions).values({
    orgId,
    actionType: "reply_review",
    source,
    status: "completed",
    targetType: "review",
    targetId: reviewId,
    payload: { text },
  });

  revalidatePath("/dashboard/reviews");
  revalidatePath("/dashboard/automation");
}
