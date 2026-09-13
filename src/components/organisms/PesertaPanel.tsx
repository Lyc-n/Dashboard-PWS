import { useState } from "react";
import { KELS } from "@/lib/constants";
import type { Peserta } from "@/lib/use-kegiatan";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Select } from "@/components/atoms/Select";

const INPUT_CLS =
  "w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-xs text-ink outline-none placeholder:text-[var(--color-muted-soft)] focus:border-accent";

export interface PesertaPanelProps {
  participants: Peserta[];
  onAdd: (nama: string, kel: string, hadir: boolean) => void;
  onToggle?: (index: number, hadir: boolean) => void;
  onRemove?: (index: number) => void;
}

export function PesertaPanel({ participants, onAdd, onToggle, onRemove }: PesertaPanelProps) {
  const [nama, setNama] = useState("");
  const [kel, setKel] = useState<string>(KELS[0]);
  const [hadir, setHadir] = useState(false);

  const submit = () => {
    if (!nama.trim()) return;
    onAdd(nama.trim(), kel, hadir);
    setNama("");
    setHadir(false);
  };

  return (
    <div className="rounded-[10px] border border-line bg-surface p-3.5">
      <b className="text-[13px] text-ink">
        Daftar Peserta <span className="text-muted">({participants.length})</span>
      </b>

      {participants.length > 0 ? (
        <div className="mt-2.5 grid gap-2">
          {participants.map((p, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-2">
              <input value={p.nama} className={INPUT_CLS} readOnly />
              <Select value={p.kel} className="py-2 text-xs" aria-label={`Kelurahan peserta ${i + 1}`}>
                <option>{p.kel}</option>
              </Select>
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-ink">
                <Checkbox
                  size="sm"
                  checked={p.hadir}
                  onChange={(e) => onToggle?.(i, e.target.checked)}
                />
                Hadir
              </label>
              {onRemove ? (
                <Button variant="danger" size="sm" onClick={() => onRemove(i)}>
                  Hapus
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">Belum ada peserta.</p>
      )}

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,110px)] gap-2">
        <input
          value={nama}
          placeholder="Nama peserta"
          onChange={(e) => setNama(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className={INPUT_CLS}
        />
        <Select value={kel} onChange={(e) => setKel(e.target.value)} className="py-2 text-xs">
          {KELS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-ink">
          <Checkbox size="sm" checked={hadir} onChange={(e) => setHadir(e.target.checked)} />
          Sudah hadir
        </label>
        <Button size="sm" onClick={submit}>
          + Tambah peserta
        </Button>
      </div>
    </div>
  );
}

export default PesertaPanel;