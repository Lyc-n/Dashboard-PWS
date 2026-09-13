import { useState } from "react";
import { seedAdminItems } from "@/lib/seeds";
import type { AdminItem } from "@/lib/seeds";
import { Tag } from "@/components/atoms/Tag";
import { CardHeader } from "@/components/molecules/CardHeader";
import { ManageItemRow } from "@/components/molecules/ManageItemRow";

export interface KelolaChecklistPanelProps {
  items?: AdminItem[];
  onChange?: (items: AdminItem[]) => void;
}

export function KelolaChecklistPanel({ items, onChange }: KelolaChecklistPanelProps) {
  const [local, setLocal] = useState<AdminItem[]>(seedAdminItems);
  const list = items ?? local;
  const update = (next: AdminItem[]) => {
    setLocal(next);
    onChange?.(next);
  };

  return (
    <section className="mt-4 rounded-lg border border-line bg-surface p-4">
      <CardHeader
        title="Kelola Checklist"
        sub="Nyalakan/matikan pertanyaan yang dipakai saat input checklist."
      />
      <div className="mt-3.5 grid gap-2.5">
        {list.map((item) => (
          <ManageItemRow
            key={item.id}
            title={item.judul}
            description={
              <>
                <span className="mr-1.5">
                  <Tag priority={item.prio} />
                </span>
                <span className="align-middle">{item.desk}</span>
              </>
            }
            active={item.on}
            onToggle={(on) => update(list.map((x) => (x.id === item.id ? { ...x, on } : x)))}
          />
        ))}
      </div>
    </section>
  );
}

export default KelolaChecklistPanel;