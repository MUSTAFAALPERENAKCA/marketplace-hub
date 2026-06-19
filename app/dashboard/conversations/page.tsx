import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { requireOrgId } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  web_chat: "Web chat",
  email: "E-posta",
};

function formatDate(date: Date | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function ConversationsPage() {
  const orgId = await requireOrgId();

  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.orgId, orgId))
    .orderBy(desc(conversations.lastMessageAt));

  return (
    <div>
      <Header
        title="Konuşmalar"
        description="WhatsApp, Instagram ve web chat — AI'nın çözemediği konuşmalar üstte"
      />
      <div className="p-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Müşteri</TableHead>
              <TableHead>Kanal</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Son mesaj</TableHead>
              <TableHead>Zaman</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Henüz konuşma yok. /chat-widget?org={orgId} adresinden test edebilirsin.
                </TableCell>
              </TableRow>
            )}
            {rows.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell>
                  <Link href={`/dashboard/conversations/${conversation.id}`} className="font-medium hover:underline">
                    {conversation.customerName ?? conversation.customerPhone ?? conversation.externalId ?? "Anonim"}
                  </Link>
                </TableCell>
                <TableCell>{CHANNEL_LABELS[conversation.channel] ?? conversation.channel}</TableCell>
                <TableCell>
                  <StatusBadge status={conversation.status} />
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                  {conversation.lastMessagePreview ?? "—"}
                </TableCell>
                <TableCell>{formatDate(conversation.lastMessageAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
