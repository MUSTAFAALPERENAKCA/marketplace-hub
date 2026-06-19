import type { MarketplaceAdapter, MarketplaceProvider } from "./types";
import { createMockAdapter } from "./mock/adapter";

export function getAdapter(provider: MarketplaceProvider): MarketplaceAdapter {
  const mode = process.env.MARKETPLACE_MODE ?? "mock";

  if (mode !== "mock") {
    throw new Error(
      `"${provider}" için gerçek API adapter'ı henüz uygulanmadı. MARKETPLACE_MODE=mock kullanın.`
    );
  }

  return createMockAdapter(provider);
}
