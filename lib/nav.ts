import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Undo2,
  Bot,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const dashboardNav: NavItem[] = [
  { href: "/dashboard", label: "Genel Bakış", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Siparişler", icon: Package },
  { href: "/dashboard/reviews", label: "Yorumlar", icon: MessageSquare },
  { href: "/dashboard/returns", label: "İade & İptal", icon: Undo2 },
  { href: "/dashboard/automation", label: "Otomasyon", icon: Bot },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
];
