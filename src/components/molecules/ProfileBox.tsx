import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar } from "@/components/atoms/Avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { Settings } from "lucide-react";

export interface ProfileBoxProps {
  name?: string;
  avatarSrc?: string;
}

export function ProfileBox({ name = "A. Jubaidi", avatarSrc = "https://i.pravatar.cc/100?img=12" }: ProfileBoxProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 max-md:gap-0 cursor-pointer"
        aria-label="Profil pengguna"
      >
        <span className="text-[13px] font-semibold text-ink max-md:hidden">{name}</span>
        <Avatar src={avatarSrc} size="sm" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-42 overflow-hidden rounded-xl border border-line bg-surface shadow-elev">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line">
            <span className="text-sm font-semibold text-ink">{name}</span>
          </div>
          <button
            type="button"
            ref={themeRef}
            onClick={() => themeRef.current?.querySelector("button")?.click()}
            className="flex items-center w-full px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-2 gap-2 cursor-pointer"
          >
            <ThemeToggle plain />
            Theme
          </button>
          <Link
            to="/kelola"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-2 gap-2"
          >
            <Settings size={16} strokeWidth={1.5} className="m-1"/>
            Kelola
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileBox;
