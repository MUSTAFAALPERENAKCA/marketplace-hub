import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { ConversationThread } from "./conversation-thread";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await requireOrgId();

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.orgId, orgId)))
    .limit(1);

  if (!conversation) {
    notFound();
  }

  const thread = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  return (
    <div>
      <Header
        title={conversation.customerName ?? conversation.customerPhone ?? "Anonim müşteri"}
        description={`Kanal: ${conversation.channel}`}
      />
      <ConversationThread conversationId={id} initialMessages={thread} />
    </div>
  );
}
