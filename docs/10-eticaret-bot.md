# 10 — E-ticaret Müşteri Destek Botu + Sipariş Takip

> Shopify / Trendyol / Hepsiburada mağazaları için: gelen müşteri sorularına AI otomatik yanıt + sipariş durum sorgusu + iade/değişim akışı + inceleme isteği.

## Proje Özeti

E-ticaret mağazası sahibi için:
- Çoklu kanal destek: WhatsApp, Instagram DM, web chat widget
- AI asistan: sipariş takip, ürün sorusu, iade/kargo sorgusu
- Shopify API / Trendyol Marketplace API entegrasyonu
- Kritik konular (iade, şikayet) → insana devret
- Otomatik teslim sonrası inceleme isteği
- Admin: AI'nın tek başına çözemediği konuşmalar, manuel yanıt
- Analitik: en sık sorular, ortalama yanıt süresi, insan devralma oranı

**Son kullanıcı:** Shopify veya marketplace satıcı, ayda 100+ müşteri sorusu alan, ekip küçük.

## Hedef Müşteri

- Shopify mağazası, Trendyol/Hepsiburada satıcısı
- Aylık 500-5000 sipariş
- Müşteri desteğe 2-20 saat harcıyor günlük
- Soruların %70'i aynı: "kargom nerede", "bu ürün stokta mı", "iade nasıl"

## Fiyat Modeli

- **Temel:** $600 + $120/ay — WhatsApp + AI + Shopify sync
- **Plus:** $900 + $180/ay — + Instagram + web chat widget + analytics
- **Pro:** $1200 + $250/ay — + Trendyol/Hepsiburada + multi-lang + insan ekip arayüzü

## Teknoloji Yığını

```json
{
  "base": "Mikro SaaS Başlangıç (spec 01)",
  "ai": "Claude Sonnet 4.6 (kritik) + Haiku 4.5 (hızlı)",
  "whatsapp": "Meta WhatsApp Business Cloud API",
  "instagram": "Meta Instagram Graph API",
  "shopify": "Shopify Admin API (REST veya GraphQL)",
  "trendyol": "Trendyol Marketplace API (opsiyonel)",
  "chat-widget": "Custom iframe embed veya open source Chatwoot benzeri"
}
```

## .env Değişkenleri

```
# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Meta
WHATSAPP_META_TOKEN=EAAxxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_VERIFY_TOKEN=random-string
INSTAGRAM_PAGE_ID=xxx
INSTAGRAM_PAGE_ACCESS_TOKEN=xxx

# Shopify
SHOPIFY_STORE_DOMAIN=xxxshop.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_xxx
SHOPIFY_WEBHOOK_SECRET=xxx

# Trendyol (opsiyonel)
TRENDYOL_SUPPLIER_ID=xxx
TRENDYOL_API_KEY=xxx
TRENDYOL_API_SECRET=xxx

# Business
NEXT_PUBLIC_STORE_NAME=Modastore
NEXT_PUBLIC_STORE_DESCRIPTION=Kadın giyim
STORE_SUPPORT_PHONE=+905551234567
STORE_RETURN_POLICY_URL=https://modastore.com/iade
STORE_SHIPPING_POLICY_URL=https://modastore.com/kargo
ESCALATION_TELEGRAM_CHAT=-100123

# Brand voice
ASSISTANT_NAME=Mia
ASSISTANT_TONE=samimi  # samimi, formal, eglenceli
```

## Veritabanı Şeması

```typescript
import {
  pgTable, text, timestamp, uuid, integer, numeric,
  boolean, jsonb, index
} from "drizzle-orm/pg-core";

// Müşteri (Shopify customer mirror)
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id"),       // Shopify customer.id
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: numeric("total_spent", { precision: 12, scale: 2 }).default("0"),
  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  phoneIdx: index("customers_phone_idx").on(t.phone),
  externalIdx: index("customers_external_idx").on(t.externalId),
}));

// Sipariş (cache'lenmiş)
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  externalId: text("external_id").notNull(),      // Shopify order.id
  orderNumber: text("order_number").notNull(),    // "#1042"
  customerId: uuid("customer_id").references(() => customers.id),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),

  totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
  currency: text("currency"),
  itemsJson: jsonb("items_json").$type<Array<{
    productId: string; name: string; quantity: number; price: number; variant?: string;
  }>>().default([]),

  fulfillmentStatus: text("fulfillment_status"), // "unfulfilled", "fulfilled", "shipped", "delivered"
  financialStatus: text("financial_status"),    // "pending", "paid", "refunded"

  trackingNumber: text("tracking_number"),
  trackingCompany: text("tracking_company"),     // "Yurtiçi", "Aras", "MNG"
  trackingUrl: text("tracking_url"),

  shippingAddress: jsonb("shipping_address").$type<Record<string, unknown>>(),

  placedAt: timestamp("placed_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),

  reviewRequestedAt: timestamp("review_requested_at"),

  source: text("source").default("shopify"),     // "shopify", "trendyol", "hepsiburada"
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
}, (t) => ({
  externalIdx: index("orders_external_idx").on(t.externalId),
  phoneIdx: index("orders_phone_idx").on(t.customerPhone),
  orderNumberIdx: index("orders_number_idx").on(t.orderNumber),
}));

// Konuşmalar (WhatsApp / IG / Web)
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  channel: text("channel", {
    enum: ["whatsapp", "instagram", "web_chat", "email"]
  }).notNull(),
  externalId: text("external_id"),               // WA phone number, IG sender ID
  customerId: uuid("customer_id").references(() => customers.id),
  customerPhone: text("customer_phone"),
  customerName: text("customer_name"),

  status: text("status", {
    enum: ["aktif", "ai_handling", "insan_bekliyor", "cozuldu", "kapandi"]
  }).default("ai_handling").notNull(),

  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  lastMessagePreview: text("last_message_preview"),
  messageCount: integer("message_count").default(0),

  topic: text("topic"),                           // AI tarafından özetlenmiş konu
  sentiment: text("sentiment", { enum: ["olumlu", "notr", "olumsuz"] }),

  handledByUserId: text("handled_by_user_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  channelExtIdx: index("conversations_channel_ext_idx").on(t.channel, t.externalId),
  statusIdx: index("conversations_status_idx").on(t.status),
}));

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  direction: text("direction", { enum: ["gelen", "giden"] }).notNull(),
  sender: text("sender", { enum: ["musteri", "ai", "insan"] }).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type", { enum: ["metin", "resim", "video", "dosya"] }).default("metin"),
  mediaUrl: text("media_url"),
  externalMessageId: text("external_message_id"), // WA msg ID
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// FAQ / Knowledge base
export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),                    // "kargo", "iade", "urun", "genel"
  tags: jsonb("tags").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true).notNull(),
  useCount: integer("use_count").default(0),
});
```

## Sayfa Yapısı

```
app/
├── page.tsx                              # Landing (mağaza pazarlama içerik değil; kit'in pazarlama ekranı müşteri mağazasına göre değişir)
├── chat-widget/page.tsx                  # iframe olarak embed edilen widget
├── admin/
│   ├── page.tsx                          # Dashboard: aktif konuşma, bugün, AI çözüm oranı
│   ├── conversations/page.tsx            # Tüm konuşmalar
│   ├── conversations/[id]/page.tsx       # Konuşma detay + insan yanıt giriş
│   ├── orders/page.tsx                   # Sipariş sorgula/ara
│   ├── orders/[id]/page.tsx              # Sipariş detay
│   ├── knowledge-base/page.tsx           # FAQ yönetim
│   ├── analytics/page.tsx                # AI vs insan oranı, topics
│   └── ayarlar/page.tsx                  # Shopify, Meta, ton ayarı
└── api/
    ├── whatsapp/webhook/route.ts
    ├── whatsapp/verify/route.ts
    ├── instagram/webhook/route.ts
    ├── chat-widget/message/route.ts      # Web chat gelen mesaj
    ├── shopify/webhook/route.ts          # Order created/updated/fulfilled
    ├── conversations/[id]/escalate/route.ts # İnsan alır
    ├── conversations/[id]/reply/route.ts    # İnsan yanıtı gönder
    └── cron/review-request/route.ts        # Teslim sonrası 3 gün
```

## AI Assistant Core Prompt

`lib/prompts/assistant.ts`:

```typescript
export const ASSISTANT_PROMPT = (context: {
  storeName: string;
  storeDescription: string;
  assistantName: string;
  tone: string;
  returnPolicyUrl: string;
  shippingPolicyUrl: string;
  knowledgeBase: { question: string; answer: string }[];
}) => `
Sen ${context.storeName} e-ticaret mağazasının müşteri destek asistanı ${context.assistantName}sın.
Mağaza: ${context.storeDescription}. Ton: ${context.tone}.

## Görev
Müşteri sorularına kısa, faydalı Türkçe yanıt ver. Her yanıt:
- 1-3 cümle
- Link veya yönlendirme içerir
- "Efendim/Efendim" değil "Sizlere", samimi ama saygılı
- Emoji az

## Yeteneklerin (tool'lar)

1. **get_order_status(orderNumber, email?)** — sipariş durum sorgusu
2. **create_return_request(orderNumber, reason)** — iade talebi oluştur
3. **search_product(query)** — ürün ara
4. **escalate_to_human(reason, urgency)** — insana aktar

## Ne zaman insana aktarırsın?

İnsana aktar:
- Şikayet ("bu kalitesiz", "hayal kırıklığı")
- İade onayı gerektiren durumlar
- Hakaret / küfür / duygusal yoğunluk
- "Benzer ürün yok mu" detaylı tavsiye
- Özel istek (toplu alım, hediye paketi, kargo değişiklik)

İnsana aktarmazsın:
- Sipariş takip (tool ile çözülür)
- Genel kargo bilgisi (FAQ'tan)
- Beden sorusu (FAQ / ürün detayı)

## Knowledge Base

${context.knowledgeBase.map(k => `Q: ${k.question}\nA: ${k.answer}`).join('\n\n')}

## Yasaklar

- Ürün fiyatı hakkında "pazarlık" veya indirim sözü
- Rakip mağaza önerme
- Garantisi olmayan taahhütler ("yarın garantili teslim")
- Müşteri kişisel verisini başkasıyla paylaşma

## Yanıt formatı

Normal yanıtta doğrudan metin.
Tool kullanılacaksa function call yap.
Escalation olursa ${"{escalate: true, reason: '...'}"} özel output.
`;
```

## API: WhatsApp Webhook (Ana Flow)

`app/api/whatsapp/webhook/route.ts`:

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const msg = parseWhatsAppMessage(body); // Meta webhook structure
  if (!msg) return NextResponse.json({ ok: true });

  // 1. Conversation bul veya yarat
  let conv = await db.select().from(conversations).where(and(
    eq(conversations.channel, "whatsapp"),
    eq(conversations.externalId, msg.from),
  )).limit(1);

  if (!conv[0]) {
    [conv[0]] = await db.insert(conversations).values({
      channel: "whatsapp",
      externalId: msg.from,
      customerPhone: msg.from,
      customerName: msg.profileName,
      status: "ai_handling",
    }).returning();
  }

  // 2. Mesaj kaydet
  await db.insert(messages).values({
    conversationId: conv[0].id,
    direction: "gelen",
    sender: "musteri",
    content: msg.text,
    externalMessageId: msg.id,
  });

  // 3. Eğer conversation "insan_bekliyor" ise bildiri var, AI'ya sokmayalım
  if (conv[0].status === "insan_bekliyor") {
    return NextResponse.json({ ok: true });
  }

  // 4. Context: son 10 mesaj
  const history = await db.select().from(messages)
    .where(eq(messages.conversationId, conv[0].id))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  const kb = await db.select().from(knowledgeBase).where(eq(knowledgeBase.isActive, true));

  // 5. AI çağır
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: ASSISTANT_PROMPT({
      storeName: process.env.NEXT_PUBLIC_STORE_NAME!,
      // ... diğer context
      knowledgeBase: kb,
    }),
    messages: history.reverse().map(m => ({
      role: m.sender === "musteri" ? "user" : "assistant",
      content: m.content,
    })),
    tools: [
      { name: "get_order_status", /*...*/ },
      { name: "create_return_request", /*...*/ },
      { name: "search_product", /*...*/ },
      { name: "escalate_to_human", /*...*/ },
    ],
  });

  // 6. Tool call varsa execute et
  for (const block of response.content) {
    if (block.type === "tool_use") {
      const result = await handleToolCall(block.name, block.input);
      // Tool sonucu ile tekrar AI'a sor (response'u al)
    }
  }

  // 7. Escalation kontrolü
  if (response.stop_reason === "tool_use" && response.content.some(b => b.type === "tool_use" && b.name === "escalate_to_human")) {
    await db.update(conversations).set({ status: "insan_bekliyor" }).where(eq(conversations.id, conv[0].id));
    await telegramSend(`🚨 İnsan bekleniyor: ${msg.from}\n${msg.text}`, process.env.ESCALATION_TELEGRAM_CHAT!);
    return NextResponse.json({ ok: true });
  }

  // 8. Final text yanıtı WhatsApp'a gönder
  const text = extractTextResponse(response);
  await sendWhatsAppMessage(msg.from, text);
  await db.insert(messages).values({
    conversationId: conv[0].id,
    direction: "giden",
    sender: "ai",
    content: text,
  });

  return NextResponse.json({ ok: true });
}
```

## AI Tools

### `get_order_status`
Input: `{ orderNumber: string, email?: string }`
- `orders` tablosundan `orderNumber` ile ara
- Email opsiyonel doğrulama (güvenlik için sipariş email'ine nisbet)
- Shopify'dan fresh fetch (opsiyonel — DB cache fresh değilse)
- Return: `{ status, trackingUrl, estimatedDelivery, items }`

### `create_return_request`
- `orders`'tan al, eligibility kontrol (teslim mi, 14 gün içinde mi)
- `events` tablosunda log
- Shopify'da refund request create (opsiyonel — manuel onay için admin'e git)
- Müşteriye: "İade talebiniz oluşturuldu. 24 saat içinde değerlendirileceksiniz."

### `search_product`
- Shopify Product API → sorguya yakın ürünler
- Top 3 → müşteriye link + fotoğraf

### `escalate_to_human`
- Conversation status güncelle
- Telegram alert
- Müşteriye: "Bir arkadaşımıza ilettim, en kısa sürede dönüş yapacak."

## Shopify Webhook

`app/api/shopify/webhook/route.ts`:

HMAC verify → `topic` header'a göre:
- `orders/create` → `orders` INSERT, customer upsert
- `orders/fulfilled` → update `fulfillmentStatus`, `trackingNumber`, `shippedAt`
- `orders/delivered` → `deliveredAt`
- `customers/update` → customer upsert

```typescript
import crypto from "crypto";

function verifyShopifyHmac(body: string, hmacHeader: string) {
  const calculated = crypto
    .createHmac("sha256", process.env.SHOPIFY_WEBHOOK_SECRET!)
    .update(body, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hmacHeader));
}
```

## Web Chat Widget

`app/chat-widget/page.tsx` — iframe olarak mağaza sitesine embed edilir:
```html
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://destek.modastore.com/chat-widget';
    iframe.style = 'position:fixed;bottom:20px;right:20px;width:350px;height:500px;border:none';
    document.body.appendChild(iframe);
  })();
</script>
```

Widget içi: Clerk giriş yok (anonim), `sessionId` (localStorage) ile konuşma track.

`POST /api/chat-widget/message`:
- Body: `{ sessionId, message, customerEmail? }`
- channel: "web_chat", externalId: sessionId
- Aynı mesaj akışı (AI, tools, escalation)
- Response: `{ reply: "..." }`

## Cron: Review İsteği

`vercel.json`:
```json
{ "crons": [{ "path": "/api/cron/review-request", "schedule": "0 10 * * *" }] }
```

Query:
```sql
SELECT * FROM orders WHERE delivered_at IS NOT NULL
  AND delivered_at BETWEEN NOW() - INTERVAL '5 days' AND NOW() - INTERVAL '3 days'
  AND review_requested_at IS NULL
  AND customer_phone IS NOT NULL;
```

Her biri için WhatsApp:
```
Merhaba {{customerName}},
{{storeName}}'dan siparişiniz ({{orderNumber}}) elinize ulaştı mı?

Keyifli kullanımlar! Değerlendirmeniz bizim için önemli:
⭐ Google: {{googleReviewUrl}}
⭐ Trustpilot: {{trustpilotUrl}}
```

## Kabul Kriterleri

- [ ] Shopify test order → DB'de `orders` oluştu
- [ ] WhatsApp'a "kargom nerede 1042" → AI `get_order_status` çağırdı → cevap geldi
- [ ] "İade yapmak istiyorum" → create_return_request → `events` log
- [ ] "Bu çok kalitesiz, iade etmek istiyorum, para istiyorum" → escalate → Telegram alert
- [ ] Admin `/admin/conversations` → "insan_bekliyor" olan konuşmayı aç, manuel yanıt ver → müşteriye giden mesaj
- [ ] Cron teslimat 3 gün sonra → review WA gitti
- [ ] Knowledge base'e FAQ ekle → sonraki AI yanıtında kullanıldı

## Build Sırası

1. Spec 01 base
2. Schema + seed (mock orders, customers, knowledge base 20 FAQ)
3. Shopify webhook endpoint + HMAC verify
4. Conversation + message tabloları
5. WhatsApp webhook + AI core flow (tool'suz önce)
6. AI tools implementasyonu
7. Escalation flow + Telegram
8. Admin conversations UI + manual reply
9. Instagram webhook (aynı flow)
10. Web chat widget
11. Knowledge base yönetim UI
12. Analytics dashboard
13. Review cron
14. End-to-end test

## Önemli Uyarılar

- **Order lookup güvenliği** — sadece order number değil, email/phone doğrulaması (kimse başkasının siparişini sorgulayamasın)
- **AI token maliyeti** — ayda 5000 konuşma × 5 mesaj × 500 token = 12.5M token, Sonnet $38/ay. Haiku kullanılırsa $3
- **Rate limit** — Meta WA free tier 1000 conversation/month, fazlası ücretli
- **Shopify API limit** — 2 req/sec — rate limiter şart, queue kullan
- **Multi-lang** — Türkçe default, EN gerekirse system prompt + knowledge base çeviri
- **Mesaj tekrar önleme** — `external_message_id` unique, aynı webhook 2 kere gelse yine yazma
- **Conversation timeout** — 24 saat sonra `status: kapandi` (cron), yeni mesaj yeni conversation değil aynı'nı reopen
- **Hassas içerik** — müşteri kredi kartı / şifre yazarsa AI "yasal değil, paylaşmayın" de + redaction
