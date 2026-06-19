# Marketplace Hub

Trendyol, Amazon ve Hepsiburada'da satış yapan satıcılar için **tek panelden
yönetim** sistemi: siparişler, yorumlar ve iade/iptal talepleri tek ekranda
toplanır; rutin işleri AI otomatik yürütür, kritik kararlar (iade onayı,
şikayet) panelden satıcının onayına düşer. WhatsApp/Instagram/web chat
müşteri destek botu aynı veritabanı ve AI çekirdeğini paylaşır.

Gerçek pazaryeri API erişimi gerektirmeden, **mock veriyle eksiksiz
çalışan** bir multi-tenant SaaS.

## Özellikler

- **Multi-tenant**: Clerk Organizations ile her satıcı kendi hesabını açar.
- **Konsolide görünüm**: Trendyol/Amazon/Hepsiburada siparişleri, yorumları
  ve iade talepleri tek listede.
- **Hibrit otomasyon**: standart iade talepleri otomatik onaylanır;
  şikayet/kalite sorunu içeren talepler insan onayına düşer
  (`/dashboard/returns`).
- **Otomasyon denetim kaydı**: AI/otomasyonun yaptığı her işlem
  `/dashboard/automation`'da görülebilir (tamamlanan, onay bekleyen,
  onaylanan, reddedilen).
- **AI yorum yanıtları**: Claude Haiku ile yorumlara Türkçe yanıt önerisi
  (API key yoksa şablon yanıta düşer, özellik kırılmaz).
- **AI müşteri destek botu**: sipariş durumu sorgulama, iade talebi açma,
  gerektiğinde insana aktarma — `/chat-widget` üzerinden test edilebilir.
- **Pazaryeri adapter pattern**: `lib/marketplaces/types.ts`'teki
  `MarketplaceAdapter` arayüzü mock ve gerçek implementasyonlar için ortak;
  gerçek API anahtarları geldiğinde mock adapter 1:1 değiştirilebilir.

## Teknoloji Yığını

Next.js 16 (App Router, TypeScript) · Drizzle ORM + PostgreSQL ·
Tailwind CSS + shadcn/ui · Clerk (auth + organizations) ·
Anthropic SDK (Claude Sonnet 4.6 / Haiku 4.5)

## Mimari

```
lib/marketplaces/
├── types.ts          # MarketplaceAdapter arayüzü (provider-agnostic)
├── registry.ts        # MARKETPLACE_MODE'a göre mock/gerçek adapter seçimi
├── sync.ts             # adapter → DB senkronizasyonu
└── mock/               # sahte Trendyol/Amazon/Hepsiburada verisi üretir

lib/automation/engine.ts  # hibrit otomasyon: otomatik onay vs. insan onayı
lib/ai/                   # Claude entegrasyonu (yorum yanıtı + destek botu)

db/schema.ts            # multi-tenant şema (her tablo org_id taşır)
app/dashboard/           # asıl panel (orders, reviews, returns, automation,
                         # conversations, settings)
app/chat-widget/         # embed edilebilir test destek widget'ı
app/onboarding/          # org oluşturma + pazaryeri bağlama akışı
```

## Kurulum

### Gereksinimler

- Node.js 20+
- Docker (yerel PostgreSQL için)
- [Clerk](https://clerk.com) hesabı (auth + organizations)
- (Opsiyonel) [Anthropic API key](https://console.anthropic.com) — yoksa AI
  özellikleri şablon yanıtlara düşer, panel kırılmaz.

### Adımlar

```bash
npm install
cp .env.example .env
# .env içine Clerk publishable/secret key'lerini ekle

docker compose up -d        # Postgres'i 5433 portunda başlatır
npm run db:push             # şemayı uygula

npm run dev                 # http://localhost:3000
```

> Not: `docker-compose.yml` Postgres'i **5433** portuna map'ler — bu
> makinede zaten 5432'de native bir Postgres servisi çalışıyorsa çakışma
> olmasın diye. Kendi ortamında 5432 boşsa `docker-compose.yml` ve
> `.env`'i değiştirebilirsin.

İlk satıcıyı oluşturduktan sonra (`/sign-up` → org oluştur), pazaryerlerini
`/onboarding/connect`'ten mock modda bağla; bu adım otomatik olarak sahte
sipariş/yorum/iade verisiyle paneli doldurur.

Alternatif olarak komut satırından demo veri üretmek için:

```bash
npm run db:seed -- <clerk-org-id>
```

### Web chat botunu test etme

```
http://localhost:3000/chat-widget?org=<clerk-org-id>
```

"Siparişim nerede #482913" gibi bir mesaj yaz; AI sipariş tablosundan
sorgulayıp yanıtlayacak. ANTHROPIC_API_KEY tanımlı değilse şablon yanıt
döner, akış kırılmaz.

## Faydalı komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Drizzle şemasını veritabanına uygula |
| `npm run db:generate` | Migration SQL dosyası üret |
| `npm run db:studio` | Drizzle Studio (veritabanı tarayıcısı) |
| `npm run db:seed -- <org-id>` | Demo org için mock veri üret |

## Yol haritası

Mimaride yeri ayrılmış ama gerçek Meta API kimlik bilgisi gerektirdiği
için bu sürümde uygulanmayanlar:

- WhatsApp Business Cloud API webhook'u (`conversations` tablosu ve AI
  çekirdeği zaten kanal-agnostik, sadece webhook route'u eklenecek)
- Instagram Graph API webhook'u
- Knowledge base yönetim arayüzü (`knowledge_base` tablosu hazır)
- Gerçek Trendyol/Amazon/Hepsiburada API adapter'ları (mock adapter'ların
  1:1 karşılığı — `lib/marketplaces/mock/` dizinindeki implementasyona
  bakarak yazılabilir)

## Referans

`docs/10-eticaret-bot.md` — bu projenin başlangıç noktası olan WhatsApp/
Instagram AI destek botu + sipariş takip speci.
