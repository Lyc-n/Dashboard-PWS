import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { seedAdminItems, seedAdminPrios, seedAdminStaff } from "@/lib/seeds";
import type { AdminItem, Priority, Staff } from "@/lib/seeds";
import { useLocalStorage } from "@/lib/use-local-storage";
import { KELS, PERAN, POSY, STORAGE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TagVariant } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { AppShell } from "@/components/organisms/AppShell";
import { DataTable } from "@/components/organisms/DataTable";
import { SectionCard } from "@/components/molecules/SectionCard";
import { ManageItemRow } from "@/components/molecules/ManageItemRow";
import { ChipGroup } from "@/components/molecules/ChipGroup";
import { StatCard } from "@/components/molecules/StatCard";
import { Toolbar } from "@/components/molecules/Toolbar";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { Tab } from "@/components/atoms/Tab";
import { Tag } from "@/components/atoms/Tag";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { EmptyState } from "@/components/atoms/EmptyState";

export const Route = createFileRoute("/kelola")({
  component: Kelola,
})

type DlgKind = "item" | "prio" | "staff";

interface DlgState {
  kind: DlgKind;
  title: string;
  edit?: AdminItem | Priority | Staff;
  form: Record<string, string>;
  errs: Record<string, string>;
}

const TABS = [
  { key: "checklist", label: "Checklist" },
  { key: "prioritas", label: "Prioritas" },
  { key: "staff", label: "Staff" },
] as const;

function toVariant(w: string | undefined): TagVariant {
  const v = w?.startsWith("tag-") ? w.slice(4) : w;
  return (["odgj", "bumil", "balita", "tb", "stunt"] as const).includes(v as TagVariant)
    ? (v as TagVariant)
    : "odgj";
}

function CtlField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-ink">
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      <span className={cn("text-[11px] font-semibold text-danger", !error && "hidden")}>
        {error || "Wajib diisi."}
      </span>
    </label>
  );
}

function Modal({
  title,
  onClose,
  onSave,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-[480px] overflow-auto rounded-xl border border-line bg-surface p-4 shadow-elev">
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

function Kelola() {
  const toast = useToast();
  const uid = useRef(Date.now());

  const [items, setItems] = useLocalStorage<AdminItem[]>(STORAGE_KEYS.adminItems, seedAdminItems());
  const [prios, setPrios] = useLocalStorage<Priority[]>(STORAGE_KEYS.adminPrios, seedAdminPrios());
  const [staff, setStaff] = useLocalStorage<Staff[]>(STORAGE_KEYS.adminStaff, seedAdminStaff());

  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("checklist");
  const [curPrio, setCurPrio] = useState<string>(
    () => seedAdminPrios().find((p) => p.on)?.nama ?? "ODGJ",
  );
  const [staffQ, setStaffQ] = useState("");
  const [staffF, setStaffF] = useState("all");
  const [dlg, setDlg] = useState<DlgState | null>(null);

  const itemOn = items.filter((i) => i.on).length;
  const prioOn = prios.filter((p) => p.on).length;
  const staffOn = staff.filter((s) => s.on).length;

  const curItems = items.filter((i) => i.prio === curPrio);
  const curOn = curItems.filter((i) => i.on).length;

  const filteredStaff = useMemo(
    () =>
      staff.filter(
        (s) =>
          (staffF === "all" || (staffF === "on" ? s.on : !s.on)) &&
          (!staffQ || s.nama.toLowerCase().includes(staffQ.toLowerCase())),
      ),
    [staff, staffF, staffQ],
  );

  const setForm = (key: string, value: string) =>
    setDlg((d) => (d ? { ...d, form: { ...d.form, [key]: value }, errs: { ...d.errs, [key]: "" } } : d));

  const saveDlg = () => {
    if (!dlg) return;
    if (dlg.kind === "item") {
      const judul = (dlg.form.judul).trim();
      if (!judul) {
        setDlg((d) => ({ ...d!, errs: { ...d!.errs, judul: "Wajib isi judul butir." } }));
        return;
      }
      const desk = dlg.form.desk;
      if (dlg.edit) {
        setItems((prev) => prev.map((x) => (x.id === (dlg.edit as AdminItem).id ? { ...x, judul, desk } : x)));
      } else {
        setItems((prev) => [...prev, { id: `it-${uid.current++}`, prio: curPrio, judul, desk, on: true }]);
      }
      toast("Butir tersimpan.");
    } else if (dlg.kind === "prio") {
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
    } else {
      const nama = (dlg.form.nama).trim();
      if (!nama) {
        setDlg((d) => ({ ...d!, errs: { ...d!.errs, nama: "Wajib isi nama staff." } }));
        return;
      }
      const payload = {
        nama,
        peran: dlg.form.peran,
        kel: dlg.form.kel,
        posy: dlg.form.posy,
        hp: dlg.form.hp,
      };
      if (dlg.edit) {
        setStaff((prev) => prev.map((s) => (s === dlg.edit ? { ...s, ...payload } : s)));
      } else {
        setStaff((prev) => [...prev, { ...payload, on: true }]);
      }
      toast("Data staff tersimpan.");
    }
    setDlg(null);
  };

  const openItemDlg = (edit?: AdminItem) =>
    setDlg({
      kind: "item",
      title: edit ? "Ubah butir" : `Tambah butir — ${curPrio}`,
      edit,
      form: { judul: edit?.judul ?? "", desk: edit?.desk ?? "" },
      errs: {},
    });

  const openPrioDlg = (edit?: Priority) =>
    setDlg({
      kind: "prio",
      title: edit ? "Ubah prioritas" : "Tambah prioritas",
      edit,
      form: { nama: edit?.nama ?? "", desk: edit?.desk ?? "", warna: toVariant(edit?.warna) },
      errs: {},
    });

  const openStaffDlg = (edit?: Staff) =>
    setDlg({
      kind: "staff",
      title: edit ? "Ubah staff" : "Tambah staff",
      edit,
      form: {
        nama: edit?.nama ?? "",
        peran: edit?.peran ?? "Kader",
        kel: edit?.kel ?? KELS[0],
        posy: edit?.posy ?? "—",
        hp: edit?.hp ?? "",
      },
      errs: {},
    });

  const deleteItem = (it: AdminItem) => {
    if (!window.confirm(`Hapus butir "${it.judul}"?`)) return;
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    toast("Butir dihapus.");
  };

  const togglePrio = (p: Priority) => {
    if (p.on && !window.confirm(`Nonaktifkan prioritas "${p.nama}"? Disembunyikan dari form.`)) return;
    setPrios((prev) => prev.map((x) => (x.nama === p.nama ? { ...x, on: !x.on } : x)));
    toast(`Prioritas ${p.on ? "dinonaktifkan" : "diaktifkan"}.`);
  };

  const toggleStaff = (s: Staff) => {
    if (s.on && !window.confirm(`Nonaktifkan "${s.nama}"? Akun tidak bisa login sampai diaktifkan lagi.`)) return;
    setStaff((prev) => prev.map((x) => (x === s ? { ...x, on: !x.on } : x)));
    toast(`${s.nama} ${s.on ? "dinonaktifkan" : "diaktifkan"}.`);
  };

  return (
    <AppShell>
      <PageHeader
        title="Kelola Master Data"
        description="Admin mengatur template checklist per prioritas, daftar prioritas, dan akun staff. Perubahan tersimpan di perangkat ini."
      />

      <div className="mt-4 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
        <StatCard caption="Butir checklist aktif" value={itemOn} />
        <StatCard caption="Prioritas aktif" value={prioOn} />
        <StatCard caption="Staff aktif" value={staffOn} />
      </div>

      <div role="tablist" aria-label="Kelola" className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Tab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} role="tab" aria-selected={tab === t.key}>
            {t.label}
          </Tab>
        ))}
      </div>

      {tab === "checklist" ? (
        <SectionCard title="Template checklist per prioritas" sub="Pilih prioritas, lalu tambah, ubah, nonaktifkan, atau hapus butir.">
          <ChipGroup
            options={prios.map((p) => ({ value: p.nama, label: p.nama + (p.on ? "" : " (nonaktif)") }))}
            selected={curPrio}
            onToggle={setCurPrio}
          />
          <Toolbar className="mt-3">
            <Button size="sm" variant="primary" onClick={() => openItemDlg()}>
              + Tambah butir
            </Button>
            <span className="ml-auto text-xs text-muted">
              {curOn} aktif dari {curItems.length} butir · {curPrio}
            </span>
          </Toolbar>
          <div className="mt-3 grid gap-2">
            {curItems.length === 0 ? (
              <EmptyState>Belum ada butir untuk {curPrio} — klik Tambah butir.</EmptyState>
            ) : (
              curItems.map((it) => (
                <ManageItemRow
                  key={it.id}
                  title={it.judul}
                  description={it.desk || "—"}
                  active={it.on}
                  onToggle={(v) => {
                    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, on: v } : x)));
                    toast(`Butir ${v ? "diaktifkan" : "dinonaktifkan"}.`);
                  }}
                  onEdit={() => openItemDlg(it)}
                  onDelete={() => deleteItem(it)}
                />
              ))
            )}
          </div>
        </SectionCard>
      ) : null}

      {tab === "prioritas" ? (
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
          />
        </SectionCard>
      ) : null}

      {tab === "staff" ? (
        <SectionCard title="Daftar staff & kader" sub="Nonaktifkan akun yang sudah tidak bertugas — data tidak dihapus permanen.">
          <Toolbar>
            <Button size="sm" variant="primary" onClick={() => openStaffDlg()}>
              + Tambah staff
            </Button>
            <Input
              value={staffQ}
              onChange={(e) => setStaffQ(e.target.value)}
              placeholder="Cari nama…"
              aria-label="Cari staff"
              className="max-w-55"
            />
            <Select value={staffF} onChange={(e) => setStaffF(e.target.value)} aria-label="Filter status staff" className="max-w-[180px]">
              <option value="all">Semua status</option>
              <option value="on">Aktif</option>
              <option value="off">Nonaktif</option>
            </Select>
            <span className="ml-auto text-xs text-muted">
              {filteredStaff.length} dari {staff.length} staff
            </span>
          </Toolbar>
          <DataTable
            columns={[
              { key: "nama", label: "Nama & peran" },
              { key: "wilayah", label: "Wilayah tugas" },
              { key: "kontak", label: "Kontak" },
              { key: "status", label: "Status" },
              { key: "aksi", label: "" },
            ]}
            rows={filteredStaff}
            emptyMessage="Tidak ada staff cocok."
            renderRow={(s, i) => (
              <tr key={i} className="border-b border-[var(--color-surface-2)] last:border-none hover:bg-surface-2">
                <td className="px-3 py-2.5">
                  <div className="font-semibold text-ink">{s.nama}</div>
                  <div className="text-[11px] text-muted">{s.peran}</div>
                </td>
                <td className="px-3 py-2.5">
                  Kel. {s.kel} · {s.posy}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">{s.hp}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge variant={s.on ? "on" : "off"} value={s.on ? "Aktif" : "Nonaktif"} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Button size="sm" onClick={() => openStaffDlg(s)}>
                    Ubah
                  </Button>{" "}
                  <Button size="sm" onClick={() => toggleStaff(s)}>
                    {s.on ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </td>
              </tr>
            )}
          />
        </SectionCard>
      ) : null}

      {dlg ? (
        <Modal title={dlg.title} onClose={() => setDlg(null)} onSave={saveDlg}>
          {dlg.kind === "item" ? (
            <>
              <CtlField label="Judul butir" required error={dlg.errs.judul}>
                <Input
                  value={dlg.form.judul}
                  onChange={(e) => setForm("judul", e.target.value)}
                  invalid={!!dlg.errs.judul}
                  placeholder="cth. Minum obat rutin"
                />
              </CtlField>
              <CtlField label="Penjelasan">
                <Textarea
                  value={dlg.form.desk}
                  onChange={(e) => setForm("desk", e.target.value)}
                  placeholder="cth. Obat diminum sesuai jadwal…"
                />
              </CtlField>
            </>
          ) : null}
          {dlg.kind === "prio" ? (
            <>
              <CtlField label="Nama prioritas" required error={dlg.errs.nama}>
                <Input
                  value={dlg.form.nama}
                  onChange={(e) => setForm("nama", e.target.value)}
                  invalid={!!dlg.errs.nama}
                  placeholder="cth. Lansia Risti"
                />
              </CtlField>
              <CtlField label="Deskripsi">
                <Textarea onChange={(e) => setForm("desk", e.target.value)} value={dlg.form.desk} placeholder="cth. Kelompok berisiko…" />
              </CtlField>
              <CtlField label="Warna tag">
                <Select value={dlg.form.warna} onChange={(e) => setForm("warna", e.target.value)}>
                  <option value="odgj">Hijau (ODGJ)</option>
                  <option value="bumil">Merah muda (Bumil Risti)</option>
                  <option value="balita">Hijau muda (Balita Risti)</option>
                  <option value="tb">Kuning (TB)</option>
                  <option value="stunt">Merah (Stunting)</option>
                </Select>
              </CtlField>
            </>
          ) : null}
          {dlg.kind === "staff" ? (
            <>
              <CtlField label="Nama lengkap" required error={dlg.errs.nama}>
                <Input
                  value={dlg.form.nama}
                  onChange={(e) => setForm("nama", e.target.value)}
                  invalid={!!dlg.errs.nama}
                  placeholder="cth. Ibu Warsini"
                />
              </CtlField>
              <CtlField label="Peran">
                <Select value={dlg.form.peran} onChange={(e) => setForm("peran", e.target.value)}>
                  {PERAN.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </CtlField>
              <CtlField label="Kelurahan tugas">
                <Select value={dlg.form.kel} onChange={(e) => setForm("kel", e.target.value)}>
                  {KELS.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </Select>
              </CtlField>
              <CtlField label="Posyandu">
                <Select value={dlg.form.posy} onChange={(e) => setForm("posy", e.target.value)}>
                  <option>—</option>
                  {POSY.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </CtlField>
              <CtlField label="No. HP">
                <Input
                  value={dlg.form.hp}
                  onChange={(e) => setForm("hp", e.target.value)}
                  placeholder="cth. 0812xxxx"
                  type="tel"
                />
              </CtlField>
            </>
          ) : null}
        </Modal>
      ) : null}
    </AppShell>
  )
}