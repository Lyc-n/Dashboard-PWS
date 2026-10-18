import { Link } from '@tanstack/react-router'
import { ChevronDown, ClipboardList, LogOut } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { APP_BRAND } from '@/lib/constants'
import { navItemsForUser, setDynamicFormChildren } from '@/lib/nav'
import type { NavItem } from '@/lib/nav'
import { useAuth } from '@/providers/auth'
import { cn } from '@/lib/utils'
import { getNavForms, onNavFormsChange } from '@/lib/nav-forms-cache'
import type { BarisFormulirTerisi } from '@/features/survey/services/form-runtime.server'
import brandIcon from '@/assets/brandIcon.png'

export interface SidebarProps {
  collapsed?: boolean
}

/*
 * Kelas berulang navigasi. Ditarik ke konstanta karena empat bentuk item
 * (link daun, dropdown induk, dropdown Formulir, dan anak-anaknya) menulis
 * string yang sama dengan selisih kecil — dan bug bisu pertamanya sudah
 * terjadi: rgba() acak di activeProps induk.
 */
const LINK_KELAS =
  'flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-400 ease-in-out hover:bg-surface-2'
const LINK_KELAS_TERLIPAT = 'justify-center gap-0 px-0'
// Token `accent-border` menggantikan rgba(79,214,205,0.45); nilai yang
// dekatnya tetap, tapi warna kini ikut tema gelap seperti elemen lain.
const AKTIF_INDUK = 'border border-accent-border bg-accent-light font-semibold'
const LINK_ANAK =
  'flex items-center rounded-lg px-3 py-2 text-[12px] font-medium transition-colors hover:bg-surface-2 gap-2.5'
const AKTIF_ANAK = 'bg-accent-light text-accent font-semibold'

/**
 * Kepala dropdown: tombol lebar penuh + chevron (item statis) atau tanpa
 * chevron (Formulir, yang anak-anaknya dinamis dan tetap bisa dibuka-tutup
 * tombol itu sendiri).
 */
function DropdownTrigger({
  label,
  isOpen,
  onToggle,
  icon,
  showChevron,
}: {
  label: string
  isOpen: boolean
  onToggle: () => void
  icon: React.ReactNode
  showChevron?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(LINK_KELAS, 'w-full gap-2.5')}
    >
      {icon}
      <span className={cn('truncate text-ink-2', showChevron && 'flex-1')}>
        {label}
      </span>
      {showChevron ? (
        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-muted transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      ) : null}
    </button>
  )
}

function DropdownDaftar({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-1 ml-6 space-y-1 animate-slide-down" role="menu">
      {children}
    </ul>
  )
}

function NavItemLink({
  item,
  collapsed,
}: {
  item: NavItem
  collapsed: boolean
}) {
  const Icon = item.Icon

  return (
    <Link
      key={item.to}
      to={item.to}
      activeOptions={{ exact: item.to === '/' }}
      className={cn(LINK_KELAS, collapsed ? LINK_KELAS_TERLIPAT : 'gap-2.5')}
      activeProps={{ className: AKTIF_INDUK }}
    >
      <Icon size={16} className="shrink-0" />
      <span
        className={cn(
          'truncate text-ink-2 transition-opacity duration-200',
          collapsed ? 'w-0 opacity-0' : 'opacity-100',
        )}
      >
        {item.label}
      </span>
    </Link>
  )
}

function NavItemDropdown({
  item,
  collapsed,
  openDropdown,
  setOpenDropdown,
}: {
  item: NavItem
  collapsed: boolean
  openDropdown: string | null
  setOpenDropdown: (key: string | null) => void
}) {
  const Icon = item.Icon
  const isOpen = openDropdown === item.to
  const dropdownKey = item.to ?? item.label

  if (collapsed) {
    return (
      <Link
        key={item.to}
        to={item.to}
        activeOptions={{ exact: item.to === '/' }}
        className={cn(LINK_KELAS, LINK_KELAS_TERLIPAT)}
        activeProps={{ className: AKTIF_INDUK }}
      >
        <Icon size={16} className="shrink-0" />
      </Link>
    )
  }

  return (
    <div key={item.to}>
      <DropdownTrigger
        label={item.label}
        isOpen={isOpen}
        onToggle={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        showChevron
        icon={<Icon size={16} className="shrink-0" />}
      />
      {isOpen && (
        <DropdownDaftar>
          {(item.children ?? []).map((child) => (
            <li key={child.to} role="none">
              <Link
                to={child.to}
                activeOptions={{ exact: child.to === '/' }}
                className={LINK_ANAK}
                activeProps={{ className: AKTIF_ANAK }}
              >
                <child.Icon size={14} className="shrink-0 text-muted" />
                <span className="text-ink-2">{child.label}</span>
              </Link>
            </li>
          ))}
        </DropdownDaftar>
      )}
    </div>
  )
}

function FormulirDropdownTrigger({
  collapsed,
  openDropdown,
  setOpenDropdown,
  forms,
}: {
  collapsed: boolean
  openDropdown: string | null
  setOpenDropdown: (key: string | null) => void
  forms: BarisFormulirTerisi[]
}) {
  const isOpen = openDropdown === 'formulir'
  const dropdownKey = 'formulir'

  if (collapsed) {
    return (
      <Link
        to="/form"
        search={{ jenis: '' }}
        className={cn(LINK_KELAS, LINK_KELAS_TERLIPAT)}
      >
        <ClipboardList size={16} className="shrink-0" />
      </Link>
    )
  }

  return (
    <div>
      <DropdownTrigger
        label="Formulir"
        isOpen={isOpen}
        onToggle={() => setOpenDropdown(isOpen ? null : dropdownKey)}
        icon={<ClipboardList size={16} className="shrink-0 text-accent" />}
      />
      {isOpen && (
        <DropdownDaftar>
          {forms.length === 0 ? (
            <li role="none">
              <span className="flex items-center px-3 py-2 text-[12px] font-medium text-muted">
                Belum ada form kustom
              </span>
            </li>
          ) : (
            forms.map((form) => (
              <li key={form.formVersionId} role="none">
                <Link
                  to="/isi/$formVersionId"
                  params={{ formVersionId: form.formVersionId }}
                  className={LINK_ANAK}
                  activeProps={{ className: AKTIF_ANAK }}
                >
                  <span className="text-ink-2 truncate">{form.nama}</span>
                </Link>
              </li>
            ))
          )}
        </DropdownDaftar>
      )}
    </div>
  )
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { logout } = useAuth()
  const items = navItemsForUser()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [navForms, setNavForms] = useState<BarisFormulirTerisi[]>([])
  const [loadingForms, setLoadingForms] = useState(true)

  const loadForms = useCallback(() => {
    let cancelled = false
    getNavForms().then((data) => {
      if (!cancelled) {
        setNavForms(data)
        setLoadingForms(false)
        setDynamicFormChildren(
          data.map((form) => ({
            label: form.nama,
            to: `/isi/${form.formVersionId}`,
            Icon: ClipboardList,
          })),
        )
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const cleanup = loadForms()
    const unsubscribe = onNavFormsChange(() => {
      loadForms()
    })
    return () => {
      cleanup()
      unsubscribe()
    }
  }, [loadForms])

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen flex-none flex-col overflow-hidden border-r border-line bg-surface-warm transition-[width] duration-400 ease-in-out md:flex print:hidden',
        collapsed ? 'w-16' : 'w-52.5',
      )}
    >
      <div
        className={cn(
          'm-3 flex items-center rounded-lg bg-brand',
          collapsed ? 'justify-center' : 'justify-start',
        )}
      >
        <div
          className={cn(
            'my-2 mx-3 flex shrink-0 items-center transition-[gap] duration-300',
            collapsed ? 'gap-0' : 'gap-2.5',
          )}
        >
          <img
            src={brandIcon}
            alt="logo puskesmas"
            className="h-7 object-cover"
          />
          <div
            className={cn(
              'overflow-hidden whitespace-nowrap text-white font-extrabold leading-tight transition-all duration-200 ease-in-out',
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100',
            )}
          >
            <h1 className="text-[0.65rem]">{APP_BRAND.name}</h1>
            <p className="text-[0.6rem]">{APP_BRAND.region}</p>
          </div>
        </div>
      </div>
      <nav
        className="flex flex-1 flex-col gap-1 px-3 pb-4 pt-4"
        aria-label="Navigasi utama"
      >
        {items.map((item) => {
          if (item.isDropdownTrigger) {
            if (loadingForms) return null
            return (
              <FormulirDropdownTrigger
                key="formulir"
                collapsed={collapsed}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                forms={navForms}
              />
            )
          }
          if (item.children && item.children.length > 0) {
            return (
              <NavItemDropdown
                key={item.to ?? item.label}
                item={item}
                collapsed={collapsed}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
              />
            )
          }
          return <NavItemLink key={item.to} item={item} collapsed={collapsed} />
        })}
      </nav>
      {/* `cn` di repo ini bukan tailwind-merge, jadi class px-3 vs px-0 tidak
          bisa ditimpa andal. Collapse dibranch eksplisit, bukan override. */}
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Keluar"
          className={cn(
            'flex w-full items-center rounded-lg py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10',
            collapsed ? 'justify-center' : 'gap-2 px-3',
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {collapsed ? (
            <span className="sr-only">Keluar</span>
          ) : (
            <span className="truncate">Keluar</span>
          )}
        </button>
      </div>
    </aside>
  )
}
