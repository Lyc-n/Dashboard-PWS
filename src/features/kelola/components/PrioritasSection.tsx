import { useState } from "react";
import type { AdminItem, Priority } from "@/lib/seeds";
import { useToast } from "@/providers/toast";
import { DataTable } from "@/components/organisms/DataTable";
import { SectionCard } from "@/components/molecules/SectionCard";
import { FormField } from "@/components/molecules/FormField";
import { Toolbar } from "@/components/molecules/Toolbar";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { Tag } from "@/components/atoms/Tag";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { toVariant } from "@/features/kelola/types";
import type { DlgState } from "@/features/kelola/types";
import { AdminModal } from "@/features/kelola/components/AdminModal";

interface Props {
  prios: Priority[];
  setPrios: React.Dispatch<React.SetStateAction<Priority[]>>;
  items: AdminItem[];
  setItems: React.Dispatch<React.SetStateAction<AdminItem[]>>;
}

export function PrioritasSection({ prios, setPrios, items, setItems }: Props) {
  const toast = useToast();
  const [curPrio, setCurPrio] = useState<string>(() => prios.find((p) => p.on)?.nama ?? "ODGJ");
  const [dlg, setDlg] = useState<DlgState | null>(null);

  const setForm = (key: string, value: string) =>
    setDlg((d) => (d ? { ...d, form: { ...d.form, [key]: value }, errs: { ...d.errs, [key]: "" } } : d));

  const saveDlg = () => {
    if (!dlg) return;
    const nama = (dlg.form.nama).trim();
    const errs: Record<string, string> = {};
    if (!nama) errs.nama = "Wajib isi nama prioritas.";
    else if (prios.some((p) => p.nama.toLowerCase() === nama.toLowerCase() && (dlg.edit ? p !== dlg.edit : true))) {
      errs.nama = "Nama sudah dipakai — harus unik.";
    }
    if (errs.nama) {
      setDlg((d) => ({ ...d!, errs: { ...d!.errs, ...errs } }));
      return;
    }
    const warna = dlg.form.warna;
    if (dlg.edit) {
      const old = (dlg.edit as Priority).nama;
      setPrios((prev) => prev.map((p) => (p.nama === old ? { ...p, nama, desk: dlg.form.desk, warna } : p)));
      if (old !== nama) setItems((prev) => prev.map((x) => (x.prio === old ? { ...x, prio: nama } : x)));
      if (curPrio === old) setCurPrio(nama);
    } else {
      setPrios((prev) => [...prev, { nama, desk: dlg.form.desk, warna, on: true }]);
    }
    toast("Prioritas tersimpan.");
    setDlg(null);
  };

  const openPrioDlg = (edit?: Priority) =>
    setDlg({ kind: "prio", title: edit ? "Ubah prioritas" : "Tambah prioritas", edit, form: { nama: edit?.nama ?? "", desk: edit?.desk ?? "", warna: toVariant(edit?.warna) }, errs: {} });

  const togglePrio = (p: Priority) => {
    if (p.on && !window.confirm(`Nonaktifkan prioritas "${p.nama}"? Disembunyikan dari form.`)) return;
    setPrios((prev) => prev.map((x) => (x.nama === p.nama ? { ...x, on: !x.on } : x)));
    toast(`Prioritas ${p.on ? "dinonaktifkan" : "diaktifkan"}.`);
  };

  return (
    <>
      <SectionCard title="Daftar prioritas" sub="Nama unik, warna tag, dan status aktif. Prioritas nonaktif disembunyikan dari form.">
        <Toolbar>
          <Button size="sm" variant="primary" onClick={() => openPrioDlg()}>
            + Tambah prioritas
          </Button>
        </Toolbar>
        <DataTable
          columns={[
            { key: "prioritas", label: "Prioritas" },
            { key: "deskripsi", label: "Deskripsi" },
            { key: "butir", label: "Butir" },
            { key: "status", label: "Status" },
            { key: "aksi", label: "" },
          ]}
          rows={prios}
          renderRow={(p, i) => (
            <tr key={i} className="border-b border-[var(--color-surface-2)] last:border-none hover:bg-surface-2">
              <td className="px-3 py-2.5">
                <Tag variant={toVariant(p.warna)}>{p.nama}</Tag>
              </td>
              <td className="px-3 py-2.5 text-[12px] text-muted">{p.desk}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{items.filter((x) => x.prio === p.nama).length} butir</td>
              <td className="px-3 py-2.5">
                <StatusBadge variant={p.on ? "on" : "off"} value={p.on ? "Aktif" : "Nonaktif"} />
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <Button size="sm" onClick={() => openPrioDlg(p)}>
                  Ubah
                </Button>{" "}
                <Button size="sm" onClick={() => togglePrio(p)}>
                  {p.on ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </td>
            </tr>
          )}
          renderMobileRow={(p, i) => (
            <div key={i} className="border-b border-[var(--color-surface-2)] last:border-none px-3.5 py-3">
              <div className="flex items-start justify-between gap-2">
                <Tag variant={toVariant(p.warna)}>{p.nama}</Tag>
                <StatusBadge variant={p.on ? "on" : "off"} value={p.on ? "Aktif" : "Nonaktif"} />
              </div>
              <div className="mt-1 text-[11px] text-muted">{p.desk}</div>
              <div className="mt-1.5 text-[11px] text-muted">{items.filter((x) => x.prio === p.nama).length} butir</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => openPrioDlg(p)}>Ubah</Button>
                <Button size="sm" onClick={() => togglePrio(p)}>
                  {p.on ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </div>
            </div>
          )}
        />
      </SectionCard>

      {dlg ? (
        <AdminModal title={dlg.title} onClose={() => setDlg(null)} onSave={saveDlg}>
          <FormField label="Nama prioritas" required error={dlg.errs.nama || "Wajib diisi."} invalid={!!dlg.errs.nama}>
            <Input value={dlg.form.nama} onChange={(e) => setForm("nama", e.target.value)} invalid={!!dlg.errs.nama} placeholder="cth. Lansia Risti" />
          </FormField>
          <FormField label="Deskripsi">
            <Textarea onChange={(e) => setForm("desk", e.target.value)} value={dlg.form.desk} placeholder="cth. Kelompok berisiko…" />
          </FormField>
          <FormField label="Warna tag">
            <Select value={dlg.form.warna} onChange={(e) => setForm("warna", e.target.value)}>
              <option value="odgj">Hijau (ODGJ)</option>
              <option value="bumil">Merah muda (Bumil Risti)</option>
              <option value="balita">Hijau muda (Balita Risti)</option>
              <option value="tb">Kuning (TB)</option>
              <option value="stunt">Merah (Stunting)</option>
            </Select>
          </FormField>
        </AdminModal>
      ) : null}
    </>
  );
}
