import type { MarketplaceAdapter, MarketplaceProvider } from "../types";
import {
  generateMockOrders,
  generateMockReturnRequests,
  generateMockReviews,
} from "./generator";

/**
 * Gerçek pazaryeri API'si yerine sahte veri üreten adapter. Bu provider'ın
 * şu ana kadar "görülmüş" sipariş id'lerini bellekte tutar, böylece iade
 * talepleri rastgele değil gerçekten var olan siparişlere bağlanır.
 */
export function createMockAdapter(provider: MarketplaceProvider): MarketplaceAdapter {
  const knownOrderExternalIds: string[] = [];

  return {
    provider,

    async fetchOrders() {
      const count = Math.floor(Math.random() * 6) + 2; // 2-7
      const orders = generateMockOrders(provider, count);
      knownOrderExternalIds.push(...orders.map((o) => o.externalId));
      return orders;
    },

    async fetchReviews() {
      const count = Math.floor(Math.random() * 4) + 1; // 1-4
      return generateMockReviews(provider, count);
    },

    async fetchReturnRequests() {
      if (knownOrderExternalIds.length === 0) return [];
      const count = Math.floor(Math.random() * 2) + 1; // 1-2
      return generateMockReturnRequests(provider, count, knownOrderExternalIds);
    },

    async replyToReview() {
      await new Promise((resolve) => setTimeout(resolve, 150));
    },

    async approveReturn() {
      await new Promise((resolve) => setTimeout(resolve, 150));
    },

    async rejectReturn() {
      await new Promise((resolve) => setTimeout(resolve, 150));
    },
  };
}
