import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { SectionCard } from "@/components/molecules/SectionCard";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  open,
  onChange,
  children,
  className,
  headerClassName,
}: CollapsibleSectionProps) {
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const openState = isControlled ? open : uncontrolledOpen;

  // Controlled dan uncontrolled butuh operasi berbeda, jadi dicabang di sini
  // alih-alih `setOpen = isControlled ? onChange : setUncontrolledOpen` — union
  // dari keduanya tidak bisa dipanggil karena bentuk argumennya beda.
  const toggle = () => {
    if (isControlled) onChange?.(!openState);
    else setUncontrolledOpen((o) => !o);
  };

  return (
    <SectionCard
      className={className}
      title={
        <div
          className={`flex items-center justify-between gap-2 cursor-pointer ${headerClassName}`}
          onClick={toggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && toggle()}
        >
          <div className="flex items-center gap-2">
            <ChevronDown
              className={`w-4 h-4 transition-transform ${openState ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
            <span className="font-semibold">{title}</span>
          </div>
        </div>
      }
      sub={subtitle}
    >
      {openState && <div className="mt-3 animate-slide-down">{children}</div>}
    </SectionCard>
  );
}