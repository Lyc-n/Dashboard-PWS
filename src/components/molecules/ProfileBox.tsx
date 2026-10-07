import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-media-query";

export interface ProfileBoxProps {
  name?: string;
  avatarSrc?: string;
  onLogout?: () => void;
}

export function ProfileBox({ name = "A. Jubaidi", avatarSrc = "https://i.pravatar.cc/100?img=12", onLogout }: ProfileBoxProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Desktop: logout diurus Sidebar, jadi tidak perlu dropdown di sini.
  if (!isMobile) {
    return (
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] font-semibold text-ink">{name}</span>
        <Avatar src={avatarSrc} size="sm" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 cursor-pointer"
        aria-label="Profil pengguna"
      >
        <Avatar src={avatarSrc} size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-42 overflow-hidden rounded-xl border border-line bg-surface shadow-elev">
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-danger hover:bg-surface-2 cursor-pointer"
            >
              <LogOut size={15} strokeWidth={1.6} className="m-1" />
              Keluar
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
