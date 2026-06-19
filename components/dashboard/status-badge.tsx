import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  beklemede: "Beklemede",
  hazirlaniyor: "Hazırlanıyor",
  kargoda: "Kargoda",
  teslim_edildi: "Teslim edildi",
  iptal_edildi: "İptal edildi",
  yeni: "Yeni",
  yanitlandi: "Yanıtlandı",
  talep_edildi: "Talep edildi",
  onay_bekliyor: "Onay bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
  completed: "Tamamlandı",
  pending_approval: "Onay bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  aktif: "Aktif",
  ai_handling: "AI yanıtlıyor",
  insan_bekliyor: "İnsan bekliyor",
  cozuldu: "Çözüldü",
  kapandi: "Kapandı",
};

const STATUS_CLASSES: Record<string, string> = {
  beklemede: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  hazirlaniyor: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  kargoda: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  teslim_edildi: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  iptal_edildi: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  yeni: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  yanitlandi: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  talep_edildi: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  onay_bekliyor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  onaylandi: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  reddedildi: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  aktif: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ai_handling: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  insan_bekliyor: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  cozuldu: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  kapandi: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
