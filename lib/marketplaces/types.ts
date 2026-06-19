export const marketplaceProviders = ["trendyol", "amazon", "hepsiburada"] as const;
export type MarketplaceProvider = (typeof marketplaceProviders)[number];

export type FulfillmentStatus =
  | "beklemede"
  | "hazirlaniyor"
  | "kargoda"
  | "teslim_edildi"
  | "iptal_edildi";

export type FinancialStatus = "odeme_bekliyor" | "odendi" | "iade_edildi";

export interface NormalizedOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface NormalizedOrder {
  externalId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalPrice: number;
  currency: string;
  items: NormalizedOrderItem[];
  fulfillmentStatus: FulfillmentStatus;
  financialStatus: FinancialStatus;
  trackingNumber?: string;
  trackingCompany?: string;
  placedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface NormalizedReview {
  externalId: string;
  orderExternalId?: string;
  productName: string;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: Date;
}

export interface NormalizedReturnRequest {
  externalId: string;
  orderExternalId: string;
  reason: string;
  requestedAt: Date;
}

/**
 * Tek bir pazaryeri sağlayıcısının (Trendyol/Amazon/Hepsiburada) ortak
 * arayüzü. Mock implementasyon ile gerçek API implementasyonu 1:1
 * değiştirilebilir olsun diye tüm okuma/yazma işlemleri bu interface
 * üzerinden yapılır.
 */
export interface MarketplaceAdapter {
  provider: MarketplaceProvider;
  fetchOrders(since?: Date): Promise<NormalizedOrder[]>;
  fetchReviews(since?: Date): Promise<NormalizedReview[]>;
  fetchReturnRequests(since?: Date): Promise<NormalizedReturnRequest[]>;
  replyToReview(reviewExternalId: string, text: string): Promise<void>;
  approveReturn(returnExternalId: string): Promise<void>;
  rejectReturn(returnExternalId: string, reason: string): Promise<void>;
}
