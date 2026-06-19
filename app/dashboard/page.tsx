import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { automationActions, orders, returnRequests, reviews } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, MessageSquare, Undo2, Bot } from "lucide-react";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfLast30Days() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

export default async function DashboardOverviewPage() {
  const orgId = await requireOrgId();

  const [[todayOrders], [pendingReviews], [pendingReturns], automationLast30Days] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.orgId, orgId), gte(orders.placedAt, startOfToday()))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(and(eq(reviews.orgId, orgId), eq(reviews.status, "yeni"))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(returnRequests)
      .where(and(eq(returnRequests.orgId, orgId), eq(returnRequests.status, "onay_bekliyor"))),
    db
      .select({ source: automationActions.source, status: automationActions.status })
      .from(automationActions)
      .where(and(eq(automationActions.orgId, orgId), gte(automationActions.createdAt, startOfLast30Days()))),
  ]);

  const aiResolved = automationLast30Days.filter((a) => a.source === "ai" && a.status === "completed").length;
  const aiResolutionRate =
    automationLast30Days.length > 0
      ? `${Math.round((aiResolved / automationLast30Days.length) * 100)}%`
      : "—";

  const summaryCards = [
    {
      label: "Bugünkü siparişler",
      value: String(todayOrders.count),
      description: "Trendyol + Amazon + Hepsiburada",
      icon: Package,
    },
    {
      label: "Yanıt bekleyen yorumlar",
      value: String(pendingReviews.count),
      description: "AI önerisi oluşturulabilir",
      icon: MessageSquare,
    },
    {
      label: "Onay bekleyen iadeler",
      value: String(pendingReturns.count),
      description: "Kritik, insan kararı gerekiyor",
      icon: Undo2,
    },
    {
      label: "AI çözüm oranı",
      value: aiResolutionRate,
      description: "Son 30 gün, otomasyon işlemleri",
      icon: Bot,
    },
  ];

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
