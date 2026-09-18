import { Button } from "@/components/atoms/Button";

interface Props {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

export function AdminModal({ title, onClose, onSave, children }: Props) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-[480px] max-md:max-w-full overflow-auto rounded-xl border border-line bg-surface p-4 shadow-elev">
        <div className="text-sm font-bold text-ink">{title}</div>
        <div className="mt-3.5 grid gap-3">{children}</div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={onSave}>
            Simpan
          </Button>
        </div>
      </div>
    </div>
  );
}
