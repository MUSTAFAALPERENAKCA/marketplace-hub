"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";

export async function sendHumanReply(conversationId: string, content: string) {
  const orgId = await requireOrgId();

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.orgId, orgId)))
    .limit(1);
  if (!conversation) return;

  await db.insert(messages).values({
    conversationId,
    direction: "giden",
    sender: "insan",
    content,
  });

  await db
    .update(conversations)
    .set({ status: "cozuldu", lastMessageAt: new Date(), lastMessagePreview: content.slice(0, 140) })
    .where(eq(conversations.id, conversationId));

  revalidatePath(`/dashboard/conversations/${conversationId}`);
  revalidatePath("/dashboard/conversations");
}
