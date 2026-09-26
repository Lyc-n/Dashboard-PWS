import { Menu } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/atoms/Button";
import { ProfileBox } from "@/components/molecules/ProfileBox";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/providers/auth";

export interface TopbarProps {
  onToggleCollapse?: () => void;
}

export function Topbar({ onToggleCollapse }: TopbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    // [perbaikan] logout → server (hapus row valid_session + cookie) lalu ke /pin —
    //   expect: tak ada lagi rute /login (login username/password dibuang total).
    await logout();
    void navigate({ to: "/pin" });
  };

  return (
    <header className="sticky top-0 z-5 flex py-3.5 items-center gap-2.5 border-b border-line bg-surface px-7 max-md:px-3.5 max-md:gap-2 print:hidden">
      <Button
        aria-label="Toggle sidebar"
        onClick={onToggleCollapse}
        variant="ghost"
        size="sm"
        className="px-0 max-md:hidden"
      >
        <Menu size={18} strokeWidth={1.8} />
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <ProfileBox name={user?.name} onLogout={handleLogout} />
        <span className="max-md:hidden"><ThemeToggle /></span>
      </div>
    </header>
  );
}
