import { Button } from "@/components/atoms/Button";
import { Toolbar } from "@/components/molecules/Toolbar";

interface Props {
  onReset: () => void;
  onFillDemo: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function SaveBar({ onReset, onFillDemo, onSubmit, disabled }: Props) {
  return (
    <Toolbar className="w-full">
      <span className="ml-auto text-xs text-muted">Simpan ke riwayat lokal perangkat ini.</span>
      <Button variant="default" onClick={onReset} disabled={disabled}>Reset</Button>
      <Button variant="ghost" onClick={onFillDemo} disabled={disabled}>Isi contoh</Button>
      <Button variant="primary" onClick={onSubmit} disabled={disabled}>Simpan checklist</Button>
    </Toolbar>
  );
}
