import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, MessageSquare, Undo2, Bot } from "lucide-react";

const summaryCards = [
  {
    label: "Bugünkü siparişler",
    value: "—",
    description: "3 pazaryeri toplamı",
    icon: Package,
  },
  {
    label: "Yanıt bekleyen yorumlar",
    value: "—",
    description: "AI önerisi hazır olanlar dahil",
    icon: MessageSquare,
  },
  {
    label: "Onay bekleyen iadeler",
    value: "—",
    description: "Kritik, insan kararı gerekiyor",
    icon: Undo2,
  },
  {
    label: "AI çözüm oranı",
    value: "—",
    description: "Son 30 gün",
    icon: Bot,
  },
];

export default function DashboardOverviewPage() {
  return (
    <div>
      <Header
        title="Genel Bakış"
        description="Trendyol, Amazon ve Hepsiburada operasyonun tek ekranda"
      />
      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
