import { Badge } from "@/components/ui/badge";
import type { MarketplaceProvider } from "@/lib/marketplaces/types";

const PROVIDER_LABELS: Record<MarketplaceProvider, string> = {
  trendyol: "Trendyol",
  amazon: "Amazon",
  hepsiburada: "Hepsiburada",
};

const PROVIDER_CLASSES: Record<MarketplaceProvider, string> = {
  trendyol: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  amazon: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  hepsiburada: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

export function ProviderBadge({ provider }: { provider: MarketplaceProvider }) {
  return (
    <Badge variant="outline" className={PROVIDER_CLASSES[provider]}>
      {PROVIDER_LABELS[provider]}
    </Badge>
  );
}
