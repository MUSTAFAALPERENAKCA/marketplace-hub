import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, returnRequests, reviews } from "@/db/schema";
import { getAdapter } from "./registry";
import type { MarketplaceProvider } from "./types";

export interface SyncResult {
  ordersCount: number;
  reviewsCount: number;
  returnsCount: number;
}

/**
 * Bir org + pazaryeri için adapter'dan yeni veri çekip yerel tablolara yazar.
 * Mock modda her çağrı taze, daha önce görülmemiş externalId'ler ürettiği
 * için burada upsert değil düz insert yeterli.
 */
export async function syncMarketplaceData(
  orgId: string,
  provider: MarketplaceProvider
): Promise<SyncResult> {
  const adapter = getAdapter(provider);

  const newOrders = await adapter.fetchOrders();
  for (const order of newOrders) {
    const [customer] = await db
      .insert(customers)
      .values({
        orgId,
        fullName: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      })
      .returning();

    await db.insert(orders).values({
      orgId,
      provider,
      externalId: order.externalId,
      orderNumber: order.orderNumber,
      customerId: customer.id,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      totalPrice: order.totalPrice.toString(),
      currency: order.currency,
      itemsJson: order.items,
      fulfillmentStatus: order.fulfillmentStatus,
      financialStatus: order.financialStatus,
      trackingNumber: order.trackingNumber,
      trackingCompany: order.trackingCompany,
      placedAt: order.placedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
    });
  }

  const newReviews = await adapter.fetchReviews();
  for (const review of newReviews) {
    let orderId: string | undefined;
    if (review.orderExternalId) {
      const [order] = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.orgId, orgId),
            eq(orders.provider, provider),
            eq(orders.externalId, review.orderExternalId)
          )
        )
        .limit(1);
      orderId = order?.id;
    }

    await db.insert(reviews).values({
      orgId,
      provider,
      externalId: review.externalId,
      orderId,
      productName: review.productName,
      rating: review.rating,
      comment: review.comment,
      customerName: review.customerName,
      createdAt: review.createdAt,
    });
  }

  const newReturns = await adapter.fetchReturnRequests();
  let returnsCount = 0;
  for (const ret of newReturns) {
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.orgId, orgId),
          eq(orders.provider, provider),
          eq(orders.externalId, ret.orderExternalId)
        )
      )
      .limit(1);
    if (!order) continue;

    await db.insert(returnRequests).values({
      orgId,
      provider,
      externalId: ret.externalId,
      orderId: order.id,
      reason: ret.reason,
      requestedAt: ret.requestedAt,
    });
    returnsCount += 1;
  }

  return {
    ordersCount: newOrders.length,
    reviewsCount: newReviews.length,
    returnsCount,
  };
}
