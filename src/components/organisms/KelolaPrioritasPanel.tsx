import { useState } from "react";
import { seedAdminPrios } from "@/lib/seeds";
import type { Priority } from "@/lib/seeds";
import { Tag } from "@/components/atoms/Tag";
import { CardHeader } from "@/components/molecules/CardHeader";
import { ManageItemRow } from "@/components/molecules/ManageItemRow";

export interface KelolaPrioritasPanelProps {
  items?: Priority[];
  onChange?: (items: Priority[]) => void;
}

export function KelolaPrioritasPanel({ items, onChange }: KelolaPrioritasPanelProps) {
  const [local, setLocal] = useState<Priority[]>(seedAdminPrios);
  const list = items ?? local;
  const update = (next: Priority[]) => {
    setLocal(next);
    onChange?.(next);
  };

  return (
    <section className="mt-4 rounded-lg border border-line bg-surface p-4">
      <CardHeader
        title="Kelola Prioritas"
        sub="Prioritas yang tampil sebagai tab dan checklist di form input."
      />
      <div className="mt-3.5 grid gap-2.5">
        {list.map((p) => (
          <ManageItemRow
            key={p.nama}
            title={
              <>
                <span className="mr-1.5">
                  <Tag priority={p.nama} />
                </span>
                <span className="align-middle">{p.nama}</span>
              </>
            }
            description={p.desk}
            active={p.on}
            onToggle={(on) => update(list.map((x) => (x.nama === p.nama ? { ...x, on } : x)))}
          />
        ))}
      </div>
    </section>
  );
}

export default KelolaPrioritasPanel;