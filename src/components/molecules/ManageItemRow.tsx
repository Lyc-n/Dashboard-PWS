import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/Button";
import { ToggleSwitch } from "@/components/molecules/ToggleSwitch";

export interface ManageItemRowProps {
  title: ReactNode;
  description?: ReactNode;
  active?: boolean;
  onToggle?: (active: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ManageItemRow({ title, description, active, onToggle, onEdit, onDelete, className }: ManageItemRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[10px] border border-line bg-surface p-3",
        active === false && "bg-surface-2 opacity-60",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <b className="block text-[13px]">{title}</b>
        {description ? (
          <small className="mt-0.5 block text-xs text-muted">{description || "—"}</small>
        ) : null}
      </div>
      <div className="flex flex-none flex-wrap items-center justify-end gap-1.5">
        {onToggle ? (
          <ToggleSwitch checked={!!active} onCheckedChange={onToggle}>
            Aktif
          </ToggleSwitch>
        ) : null}
        {onEdit ? (
          <Button size="sm" onClick={onEdit}>
            Ubah
          </Button>
        ) : null}
        {onDelete ? (
          <Button size="sm" variant="danger" onClick={onDelete}>
            Hapus
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default ManageItemRow;