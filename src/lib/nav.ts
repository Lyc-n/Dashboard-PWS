import { ClipboardCheck, FileText, LayoutDashboard, PersonStanding, ScrollText, Settings } from "lucide-react";
import { isAdminUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export interface NavItem {
  label: string;
  shortLabel?: string;
  to: string;
  Icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", shortLabel: "Beranda", to: "/", Icon: LayoutDashboard },
  { label: "Data Sasaran", shortLabel: "Sasaran", to: "/sasaran", Icon: FileText },
  { label: "Kunjungan Rumah", shortLabel: "Kunjungan", to: "/kunjungan-rumah", Icon: ClipboardCheck },
  { label: "Laporan", shortLabel: "Laporan", to: "/laporan", Icon: ScrollText },
  { label: "Kegiatan", shortLabel: "Kegiatan", to: "/kegiatan", Icon: PersonStanding },
  { label: "Kelola", shortLabel: "Kelola", to: "/kelola", Icon: Settings, adminOnly: true },
] as const;

export function navItemsForUser(user: AuthUser | null): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || isAdminUser(user));
}

export function bottomNavItemsForUser(user: AuthUser | null): NavItem[] {
  const items = navItemsForUser(user);
  return items.slice(0, 5);
}