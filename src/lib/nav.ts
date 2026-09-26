import { ClipboardCheck, FileText, LayoutDashboard, PersonStanding, ScrollText, Settings } from "lucide-react";
import { isAdminUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export interface NavItem {
  label: string;
  to: string;
  Icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", Icon: LayoutDashboard },
  { label: "Data Sasaran", to: "/sasaran", Icon: FileText },
  { label: "Kunjungan Rumah", to: "/kunjungan-rumah", Icon: ClipboardCheck },
  { label: "Laporan", to: "/laporan", Icon: ScrollText },
  { label: "Kegiatan", to: "/kegiatan", Icon: PersonStanding },
  { label: "Kelola", to: "/kelola", Icon: Settings, adminOnly: true },
] as const;

export function navItemsForUser(user: AuthUser | null): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || isAdminUser(user));
}

export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);

export function bottomNavItemsForUser(user: AuthUser | null): NavItem[] {
  const items = navItemsForUser(user);
  return items.slice(0, 5);
}