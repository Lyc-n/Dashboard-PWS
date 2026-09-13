import { Link } from "@tanstack/react-router";
import { APP_BRAND, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import brandIcon from "@/assets/brandIcon.png" 

export interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen flex-none flex-col overflow-hidden border-r border-line bg-surface-warm transition-[width] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] md:flex print:hidden",
        collapsed ? "w-16" : "w-52.5",
      )}
    >
      <div
        className={cn(
          "m-3 flex items-center rounded-lg bg-brand",
          collapsed ? "justify-center" : "justify-start",
        )}
      >
        <div className={cn("my-2 mx-3 flex shrink-0 items-center transition-[gap] duration-300", collapsed ? "gap-0" : "gap-2.5")}>
          <img src={brandIcon} alt="logo puskesmas" className="h-7 object-cover" />
          <div
            className={cn(
              "overflow-hidden whitespace-nowrap text-white font-extrabold leading-tight transition-all duration-200 ease-in-out",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            <h1 className="text-[0.65rem]">{APP_BRAND.name}</h1>
            <p className="text-[0.6rem]">{APP_BRAND.region}</p>
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 pb-4 pt-4" aria-label="Navigasi utama">
        {NAV_ITEMS.map((item) => {
          const Icon = item.Icon;
          return (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className={cn(
              "flex items-center rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-sea",
              collapsed ? "justify-center gap-0 px-0" : "gap-2.5",
            )}
            activeProps={{ className: "border-accent/20 border bg-accent-light font-semibold" }}
          >
            <Icon size={16} className="shrink-0" />
            <span
              className={cn(
                "truncate text-ink-2 transition-opacity duration-200",
                collapsed ? "w-0 opacity-0" : "opacity-100",
              )}
            >
              {item.label}
            </span>
          </Link>
        )})}
      </nav>
    </aside>
  );
}

export default Sidebar;