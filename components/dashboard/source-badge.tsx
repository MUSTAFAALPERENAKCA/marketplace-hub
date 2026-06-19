import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, User } from "lucide-react";

const SOURCE_LABELS: Record<string, string> = {
  ai: "AI",
  automation: "Otomasyon",
  human: "İnsan",
};

const SOURCE_ICONS = {
  ai: Sparkles,
  automation: Bot,
  human: User,
};

export function SourceBadge({ source }: { source: "ai" | "automation" | "human" }) {
  const Icon = SOURCE_ICONS[source];
  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" />
      {SOURCE_LABELS[source]}
    </Badge>
  );
}
