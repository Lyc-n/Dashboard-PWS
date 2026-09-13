import { useState } from "react";
import { seedAdminStaff } from "@/lib/seeds";
import type { Staff } from "@/lib/seeds";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CardHeader } from "@/components/molecules/CardHeader";
import { ManageItemRow } from "@/components/molecules/ManageItemRow";

export interface KelolaStaffPanelProps {
  items?: Staff[];
  onChange?: (items: Staff[]) => void;
}

export function KelolaStaffPanel({ items, onChange }: KelolaStaffPanelProps) {
  const [local, setLocal] = useState<Staff[]>(seedAdminStaff);
  const list = items ?? local;
  const update = (next: Staff[]) => {
    setLocal(next);
    onChange?.(next);
  };

  return (
    <section className="mt-4 rounded-lg border border-line bg-surface p-4">
      <CardHeader
        title="Kelola Staff"
        sub="Akun kader / bidan yang bisa mengisi data; peran dipakai di tabel daftar staff."
      />
      <div className="mt-3.5 grid gap-2.5">
        {list.map((s) => (
          <ManageItemRow
            key={s.nama}
            title={
              <>
                <span className="mr-1.5">
                  <StatusBadge value={s.peran} />
                </span>
                <span className="align-middle">{s.nama}</span>
              </>
            }
            description={`${s.kel} · ${s.posy} · HP ${s.hp}`}
            active={s.on}
            onToggle={(on) => update(list.map((x) => (x.nama === s.nama ? { ...x, on } : x)))}
          />
        ))}
      </div>
    </section>
  );
}

export default KelolaStaffPanel;