import { Button } from "@/components/atoms/Button";
import { Toolbar } from "@/components/molecules/Toolbar";

interface Props {
  onReset: () => void;
  onFillDemo: () => void;
  onSubmit: () => void;
}

export function SaveBar({ onReset, onFillDemo, onSubmit }: Props) {
  return (
    <Toolbar className="w-full">
      <span className="ml-auto text-xs text-muted">Simpan ke riwayat lokal perangkat ini.</span>
      <Button variant="default" onClick={onReset}>Reset</Button>
      <Button variant="ghost" onClick={onFillDemo}>Isi contoh</Button>
      <Button variant="primary" onClick={onSubmit}>Simpan checklist</Button>
    </Toolbar>
  );
}
