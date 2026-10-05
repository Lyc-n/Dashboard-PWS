import { ClipboardCheck, ClipboardList, FileText, LayoutDashboard, ScrollText, Settings } from "lucide-react";
import { isAdminUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";

export interface NavItem {
  label: string;
  to?: string;
  Icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  children?: NavItem[];
  isDropdownTrigger?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", Icon: LayoutDashboard },
  { label: "Data Sasaran", to: "/sasaran", Icon: FileText },
  { label: "Kunjungan Rumah", to: "/kunjungan-rumah", Icon: ClipboardCheck },
  { label: "Formulir", Icon: ClipboardList, isDropdownTrigger: true, children: [] },
  { label: "Laporan", to: "/laporan", Icon: ScrollText },
  { label: "Kelola", to: "/kelola", Icon: Settings, adminOnly: true },
] as const;

function filterAdminOnly(items: NavItem[], user: AuthUser | null): NavItem[] {
  return items
    .filter((item) => !item.adminOnly || isAdminUser(user))
    .map((item) => ({
      ...item,
      children: item.children ? filterAdminOnly(item.children, user) : undefined,
    }));
}

let dynamicFormChildren: NavItem[] = [];

export function setDynamicFormChildren(children: NavItem[]): void {
  dynamicFormChildren = children;
}

function mergeDynamicChildren(items: NavItem[]): NavItem[] {
  return items.map((item) => {
    if (item.isDropdownTrigger && item.label === "Formulir") {
      return { ...item, children: dynamicFormChildren };
    }
    return item;
  });
}

export function navItemsForUser(user: AuthUser | null): NavItem[] {
  const filtered = filterAdminOnly(NAV_ITEMS, user);
  return mergeDynamicChildren(filtered);
}

export function bottomNavItemsForUser(user: AuthUser | null): NavItem[] {
  const items = navItemsForUser(user);
  return items
    .filter((item) => item.label !== "Formulir")
    .slice(0, 5)
    .map((item) => ({ ...item, children: undefined }));
}