import type Anthropic from "@anthropic-ai/sdk";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { automationActions, conversations, messages, orders, returnRequests } from "@/db/schema";
import { getAnthropicClient } from "./client";
import { evaluateNewReturnRequests } from "@/lib/automation/engine";

const SYSTEM_PROMPT = `Sen bir e-ticaret mağazasının müşteri destek asistanısın.
Müşteri sorularına kısa (1-3 cümle), Türkçe, samimi ama saygılı yanıt ver. Emoji az kullan.

Yeteneklerin (tool'lar):
- get_order_status: sipariş numarasıyla kargo/durum sorgusu
- create_return_request: iade/değişim talebi oluşturma
- escalate_to_human: çözemediğin, şikayet içeren veya duygusal yoğunluğu yüksek konuları insana aktarma

Şikayet, hakaret, "param geri" gibi taleplerde veya emin olamadığın her durumda escalate_to_human kullan.
Rakip mağaza önerme, garantisiz teslimat taahhüdü verme, müşteri kişisel verisini paylaşma.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_order_status",
    description: "Sipariş numarası ile kargo/teslimat durumunu sorgular.",
    input_schema: {
      type: "object",
      properties: {
        orderNumber: { type: "string", description: "Sipariş numarası, örn. #482913" },
      },
      required: ["orderNumber"],
    },
  },
  {
    name: "create_return_request",
    description: "Müşteri için iade/değişim talebi oluşturur.",
    input_schema: {
      type: "object",
      properties: {
        orderNumber: { type: "string" },
        reason: { type: "string", description: "İade sebebi, müşterinin kendi cümleleriyle" },
      },
      required: ["orderNumber", "reason"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Konuşmayı bir insan temsilciye aktarır.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Neden insana aktarıldığı" },
      },
      required: ["reason"],
    },
  },
];

async function toolGetOrderStatus(orgId: string, input: { orderNumber: string }) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orgId, orgId), eq(orders.orderNumber, input.orderNumber)))
    .limit(1);

  if (!order) {
    return { found: false, message: "Bu sipariş numarasıyla bir sipariş bulamadım." };
  }

  return {
    found: true,
    status: order.fulfillmentStatus,
    trackingCompany: order.trackingCompany,
    trackingNumber: order.trackingNumber,
    placedAt: order.placedAt,
    deliveredAt: order.deliveredAt,
  };
}

async function toolCreateReturnRequest(orgId: string, input: { orderNumber: string; reason: string }) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orgId, orgId), eq(orders.orderNumber, input.orderNumber)))
    .limit(1);

  if (!order) {
    return { created: false, message: "Bu sipariş numarasıyla bir sipariş bulamadım." };
  }

  const externalId = `WEB-RET-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  await db.insert(returnRequests).values({
    orgId,
    provider: order.provider,
    externalId,
    orderId: order.id,
    reason: input.reason,
    requestedAt: new Date(),
  });

  await evaluateNewReturnRequests(orgId);
  return { created: true, message: "İade talebiniz oluşturuldu, değerlendirilecek." };
}

async function toolEscalateToHuman(orgId: string, conversationId: string, input: { reason: string }) {
  await db
    .update(conversations)
    .set({ status: "insan_bekliyor" })
    .where(eq(conversations.id, conversationId));

  await db.insert(automationActions).values({
    orgId,
    actionType: "escalate_to_human",
    source: "ai",
    status: "completed",
    targetType: "conversation",
    targetId: conversationId,
    reasoning: input.reason,
  });
}

/** Müşteri mesajını işler, gerekirse tool'ları çalıştırır, AI yanıtını kaydeder ve döner. */
export async function runAssistant(
  orgId: string,
  conversationId: string,
  userMessage: string
): Promise<string> {
  await db.insert(messages).values({
    conversationId,
    direction: "gelen",
    sender: "musteri",
    content: userMessage,
  });

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (conversation?.status === "insan_bekliyor") {
    return "";
  }

  const client = getAnthropicClient();
  if (!client) {
    const fallback =
      "Şu anda asistanımıza bağlanamıyoruz, ekibimiz en kısa sürede sizinle iletişime geçecek.";
    await db.insert(messages).values({
      conversationId,
      direction: "giden",
      sender: "ai",
      content: fallback,
    });
    return fallback;
  }

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  const anthropicMessages: Anthropic.MessageParam[] = history.reverse().map((m) => ({
    role: m.sender === "musteri" ? "user" : "assistant",
    content: m.content,
  }));

  let response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: anthropicMessages,
    tools: TOOLS,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    let escalated = false;
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
      let result: unknown;
      if (block.name === "get_order_status") {
        result = await toolGetOrderStatus(orgId, block.input as { orderNumber: string });
      } else if (block.name === "create_return_request") {
        result = await toolCreateReturnRequest(
          orgId,
          block.input as { orderNumber: string; reason: string }
        );
      } else if (block.name === "escalate_to_human") {
        await toolEscalateToHuman(orgId, conversationId, block.input as { reason: string });
        escalated = true;
        result = { escalated: true };
      } else {
        result = { error: "bilinmeyen tool" };
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    if (escalated) {
      const text = "Bir arkadaşımıza ilettim, en kısa sürede dönüş yapacak.";
      await db.insert(messages).values({
        conversationId,
        direction: "giden",
        sender: "ai",
        content: text,
      });
      return text;
    }

    anthropicMessages.push({ role: "assistant", content: response.content });
    anthropicMessages.push({ role: "user", content: toolResults });

    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
      tools: TOOLS,
    });
  }

  const textBlock = response.content.find((block) => block.type === "text");
  const finalText =
    textBlock && textBlock.type === "text" ? textBlock.text.trim() : "Üzgünüm, şu an yanıt veremiyorum.";

  await db.insert(messages).values({
    conversationId,
    direction: "giden",
    sender: "ai",
    content: finalText,
  });

  await db
    .update(conversations)
    .set({ lastMessageAt: new Date(), lastMessagePreview: finalText.slice(0, 140) })
    .where(eq(conversations.id, conversationId));

  return finalText;
}
