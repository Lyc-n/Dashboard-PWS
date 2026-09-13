import { Menu } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { SearchInput } from "@/components/molecules/SearchInput";
import { ProfileBox } from "@/components/molecules/ProfileBox";
import ThemeToggle from "@/components/ThemeToggle";

export interface TopbarProps {
  onToggleCollapse?: () => void;
  onGlobalSearch?: (value: string) => void;
}

export function Topbar({ onToggleCollapse, onGlobalSearch }: TopbarProps) {
  return (
    <header className="sticky top-0 z-5 flex py-3.5 items-center gap-4 border-b border-line bg-surface px-7 max-md:px-3.5 print:hidden">
      <Button
        aria-label="Toggle sidebar"
        onClick={onToggleCollapse}
        variant="ghost"
        size="sm"
        className="px-0"
      >
        <Menu size={18} strokeWidth={1.8} />
      </Button>
      <SearchInput onChange={(e) => onGlobalSearch?.(e.target.value)} placeholder="search"/>
      <div className="ml-auto flex items-center gap-2">
        <ProfileBox />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Topbar;