import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { runAssistant } from "@/lib/ai/assistant";

async function loadHistory(conversationId: string) {
  return db
    .select({ sender: messages.sender, content: messages.content, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!orgId || !sessionId) {
    return NextResponse.json({ error: "orgId ve sessionId gerekli" }, { status: 400 });
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.orgId, orgId),
        eq(conversations.channel, "web_chat"),
        eq(conversations.externalId, sessionId)
      )
    )
    .limit(1);

  if (!conversation) {
    return NextResponse.json({ messages: [], status: "ai_handling" });
  }

  const history = await loadHistory(conversation.id);
  return NextResponse.json({ messages: history, status: conversation.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orgId, sessionId, message } = body as {
    orgId?: string;
    sessionId?: string;
    message?: string;
  };

  if (!orgId || !sessionId || !message) {
    return NextResponse.json({ error: "orgId, sessionId, message gerekli" }, { status: 400 });
  }

  let [conversation] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.orgId, orgId),
        eq(conversations.channel, "web_chat"),
        eq(conversations.externalId, sessionId)
      )
    )
    .limit(1);

  if (!conversation) {
    [conversation] = await db
      .insert(conversations)
      .values({ orgId, channel: "web_chat", externalId: sessionId, status: "ai_handling" })
      .returning();
  }

  await runAssistant(orgId, conversation.id, message);

  const [updated] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversation.id))
    .limit(1);

  const history = await loadHistory(conversation.id);
  return NextResponse.json({ messages: history, status: updated?.status ?? conversation.status });
}
