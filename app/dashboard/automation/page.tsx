import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { automationActions } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { SourceBadge } from "@/components/dashboard/source-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTION_TYPE_LABELS: Record<string, string> = {
  order_status_lookup: "Sipariş durumu sorgusu",
  reply_review: "Yoruma yanıt",
  approve_return: "İade onayı",
  reject_return: "İade reddi",
  escalate_to_human: "İnsana aktarıldı",
  review_request: "Değerlendirme isteği",
};

const TARGET_LINKS: Record<string, (id: string) => string> = {
  order: (id) => `/dashboard/orders/${id}`,
  return_request: () => "/dashboard/returns",
  review: () => "/dashboard/reviews",
};

const FILTERS = [
  { value: undefined, label: "Tümü" },
  { value: "pending_approval", label: "Onay bekleyen" },
  { value: "completed", label: "Tamamlanan" },
  { value: "approved", label: "Onaylanan" },
  { value: "rejected", label: "Reddedilen" },
] as const;

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function AutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const orgId = await requireOrgId();

  const conditions = [eq(automationActions.orgId, orgId)];
  if (status) {
    conditions.push(eq(automationActions.status, status as never));
  }

  const actionRows = await db
    .select()
    .from(automationActions)
    .where(and(...conditions))
    .orderBy(desc(automationActions.createdAt));

  return (
    <div>
      <Header
        title="Otomasyon"
        description="AI ve otomasyonun yaptığı veya önerdiği her işlemin denetim kaydı"
      />
      <div className="p-8">
        <div className="mb-4 flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.label}
              href={f.value ? `/dashboard/automation?status=${f.value}` : "/dashboard/automation"}
            >
              <Badge
                variant={status === f.value || (!status && !f.value) ? "default" : "outline"}
                className={cn("cursor-pointer")}
              >
                {f.label}
              </Badge>
            </Link>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İşlem</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Gerekçe</TableHead>
              <TableHead>Hedef</TableHead>
              <TableHead>Tarih</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actionRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Henüz otomasyon kaydı yok.
                </TableCell>
              </TableRow>
            )}
            {actionRows.map((action) => {
              const targetHref = TARGET_LINKS[action.targetType]?.(action.targetId);
              return (
                <TableRow key={action.id}>
                  <TableCell className="font-medium">
                    {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
                  </TableCell>
                  <TableCell>
                    <SourceBadge source={action.source} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={action.status} />
                  </TableCell>
                  <TableCell className="max-w-sm text-sm text-muted-foreground">
                    {action.reasoning ?? "—"}
                  </TableCell>
                  <TableCell>
                    {targetHref ? (
                      <Link href={targetHref} className="text-sm hover:underline">
                        Görüntüle
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{formatDate(action.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
