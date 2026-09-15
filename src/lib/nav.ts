import { ClipboardCheck, FileText, LayoutDashboard, PersonStanding, ScrollText, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/", Icon: LayoutDashboard },
  { label: "Data Sasaran", to: "/sasaran", Icon: FileText },
  { label: "Input Checklist", to: "/checklist", Icon: ClipboardCheck },
  { label: "Laporan", to: "/laporan", Icon: ScrollText },
  { label: "Kegiatan", to: "/kegiatan", Icon: PersonStanding },
  { label: "Kelola", to: "/kelola", Icon: Settings },
] as const;

export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);
