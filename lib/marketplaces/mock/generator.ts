import { faker } from "@faker-js/faker/locale/tr";
import type {
  MarketplaceProvider,
  NormalizedOrder,
  NormalizedReturnRequest,
  NormalizedReview,
} from "../types";

const PRODUCT_NAMES = [
  "Oversize Örme Kazak",
  "Yüksek Bel Kot Pantolon",
  "Kapüşonlu Sweatshirt",
  "Spor Ayakkabı",
  "Deri Cüzdan",
  "Kablosuz Kulaklık",
  "Akıllı Saat Kayışı",
  "Termos Matara 1L",
  "Pamuklu T-Shirt",
  "Polarize Güneş Gözlüğü",
];

const COMPLAINT_PHRASES = [
  "Ürün hiç kaliteli değil, beklediğim gibi çıkmadı, iade istiyorum.",
  "Yanlış beden geldi, çok hayal kırıklığına uğradım.",
  "Kargo çok gecikti ve ürün hasarlı geldi, paramı geri istiyorum.",
];

const NORMAL_RETURN_PHRASES = [
  "Beden uymadı, değişim/iade yapmak istiyorum.",
  "Ürünü beğenmedim, iade etmek istiyorum.",
  "Yanlış ürün gönderildi.",
];

const PROVIDER_PREFIX: Record<MarketplaceProvider, string> = {
  trendyol: "TY",
  amazon: "AMZ",
  hepsiburada: "HB",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockOrders(
  provider: MarketplaceProvider,
  count: number
): NormalizedOrder[] {
  const prefix = PROVIDER_PREFIX[provider];

  return Array.from({ length: count }, () => {
    const placedAt = faker.date.recent({ days: 14 });
    const fulfillmentStatus = pick([
      "beklemede",
      "hazirlaniyor",
      "kargoda",
      "teslim_edildi",
    ] as const);
    const itemCount = faker.number.int({ min: 1, max: 3 });

    return {
      externalId: `${prefix}-${faker.string.alphanumeric(10).toUpperCase()}`,
      orderNumber: `#${faker.number.int({ min: 100000, max: 999999 })}`,
      customerName: faker.person.fullName(),
      customerEmail: faker.internet.email(),
      customerPhone: `+90${faker.string.numeric(10)}`,
      totalPrice: Number(faker.commerce.price({ min: 150, max: 4000 })),
      currency: "TRY",
      items: Array.from({ length: itemCount }, () => ({
        productId: faker.string.uuid(),
        name: pick(PRODUCT_NAMES),
        quantity: faker.number.int({ min: 1, max: 2 }),
        price: Number(faker.commerce.price({ min: 100, max: 1500 })),
      })),
      fulfillmentStatus,
      financialStatus: fulfillmentStatus === "teslim_edildi" ? "odendi" : "odeme_bekliyor",
      trackingNumber:
        fulfillmentStatus === "kargoda" || fulfillmentStatus === "teslim_edildi"
          ? faker.string.alphanumeric(12).toUpperCase()
          : undefined,
      trackingCompany:
        fulfillmentStatus === "kargoda" || fulfillmentStatus === "teslim_edildi"
          ? pick(["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo"])
          : undefined,
      placedAt,
      shippedAt: fulfillmentStatus !== "beklemede" ? faker.date.soon({ days: 1, refDate: placedAt }) : undefined,
      deliveredAt:
        fulfillmentStatus === "teslim_edildi"
          ? faker.date.soon({ days: 3, refDate: placedAt })
          : undefined,
    };
  });
}

export function generateMockReviews(
  provider: MarketplaceProvider,
  count: number
): NormalizedReview[] {
  const prefix = PROVIDER_PREFIX[provider];

  return Array.from({ length: count }, () => {
    const isNegative = faker.number.int({ min: 1, max: 100 }) <= 25;
    const rating = isNegative
      ? faker.number.int({ min: 1, max: 2 })
      : faker.number.int({ min: 3, max: 5 });

    return {
      externalId: `${prefix}-REV-${faker.string.alphanumeric(10).toUpperCase()}`,
      productName: pick(PRODUCT_NAMES),
      rating,
      comment: isNegative ? pick(COMPLAINT_PHRASES) : faker.lorem.sentence({ min: 5, max: 15 }),
      customerName: faker.person.fullName(),
      createdAt: faker.date.recent({ days: 7 }),
    };
  });
}

export function generateMockReturnRequests(
  provider: MarketplaceProvider,
  count: number,
  orderExternalIds: string[]
): NormalizedReturnRequest[] {
  const prefix = PROVIDER_PREFIX[provider];
  if (orderExternalIds.length === 0) return [];

  return Array.from({ length: count }, () => {
    const isComplaint = faker.number.int({ min: 1, max: 100 }) <= 30;
    return {
      externalId: `${prefix}-RET-${faker.string.alphanumeric(10).toUpperCase()}`,
      orderExternalId: pick(orderExternalIds),
      reason: isComplaint ? pick(COMPLAINT_PHRASES) : pick(NORMAL_RETURN_PHRASES),
      requestedAt: faker.date.recent({ days: 5 }),
    };
  });
}
