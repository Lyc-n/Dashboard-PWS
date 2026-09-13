import { Link } from "@tanstack/react-router";
import { BOTTOM_NAV_ITEMS } from "@/lib/constants";

export function BottomNav() {
  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-line bg-surface pt-1.5 md:hidden print:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const { Icon } = item;
        return (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="flex flex-col items-center gap-[3px] rounded-[10px] px-3.5 py-1.5 text-[10px] font-semibold text-muted transition-colors"
            activeProps={{ className: "bg-accent-light text-accent" }}
          >
            <Icon size={20} strokeWidth={1.7} />
            {item.label.replace("Input ", "")}
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;