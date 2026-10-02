import { Button } from "@/components/atoms/Button";

interface Props {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  disabled?: boolean;
}

export function ConfirmModal({
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = "Ya",
  variant = "primary",
  disabled = false,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative w-full max-w-[400px] rounded-xl border border-line bg-surface p-4 shadow-elev">
        <div className="text-sm font-bold text-ink">{title}</div>
        <div className="mt-3 text-sm text-ink-2">{message}</div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={onClose} disabled={disabled}>Batal</Button>
          <Button variant={variant} onClick={onConfirm} disabled={disabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}