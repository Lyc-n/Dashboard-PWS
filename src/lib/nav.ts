import {
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  /** Label ringkas untuk nav bawah yang sempit. Falls back ke `label` kalau kosong. */
  shortLabel?: string
  to?: string
  Icon: LucideIcon
  children?: NavItem[]
  isDropdownTrigger?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', shortLabel: 'Home', to: '/', Icon: LayoutDashboard },
  {
    label: 'Data Sasaran',
    shortLabel: 'Sasaran',
    to: '/sasaran',
    Icon: FileText,
  },
  {
    label: 'Kunjungan Rumah',
    shortLabel: 'Kunjungan',
    to: '/kunjungan-rumah',
    Icon: ClipboardCheck,
  },
  {
    label: 'Formulir',
    shortLabel: 'Formulir',
    Icon: ClipboardList,
    isDropdownTrigger: true,
    children: [],
  },
  { label: 'Laporan', shortLabel: 'Laporan', to: '/laporan', Icon: ScrollText },
  { label: 'Kelola', shortLabel: 'Kelola', to: '/kelola', Icon: Settings },
] as const

let dynamicFormChildren: NavItem[] = []

export function setDynamicFormChildren(children: NavItem[]): void {
  dynamicFormChildren = children
}

function mergeDynamicChildren(items: NavItem[]): NavItem[] {
  return items.map((item) => {
    if (item.isDropdownTrigger && item.label === 'Formulir') {
      return { ...item, children: dynamicFormChildren }
    }
    return item
  })
}

/**
 * Semua pengguna melihat menu yang sama.
 *
 * Sebelumnya ada `adminOnly` + `filterAdminOnly` yang menyaring berdasarkan
 * `isAdminUser`. Karena profil sesi konstan dengan role "Admin", saringan itu
 * selalu lolos untuk setiap item — tidak pernah menyembunyikan apa pun. Para
 * pemanggilnya sudah kehilangan akses ke user: nav tidak lagi bergantung pada
 * siapa yang login.
 */
export function navItemsForUser(): NavItem[] {
  return mergeDynamicChildren(NAV_ITEMS)
}

export function bottomNavItemsForUser(): NavItem[] {
  return navItemsForUser()
    .filter((item) => item.label !== 'Formulir')
    .slice(0, 5)
    .map((item) => ({ ...item, children: undefined }))
}
