import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { seedAdminItems, seedAdminPrios, seedAdminStaff } from "@/lib/seeds";
import type { AdminItem, Priority, Staff } from "@/lib/seeds";
import { useLocalStorage } from "@/lib/use-local-storage";
import { KELS, PERAN, POSY, PRIOS, STORAGE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TagVariant } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { useKrTemplates } from "@/lib/use-kr-templates";
import { createFieldId, getNextOrder } from "@/lib/kr-templates";
import type { KrSection, KrTemplateField } from "@/lib/kr-templates";
import type { SasaranKey } from "@/lib/kr-form";
import { SASARAN_KEYS } from "@/lib/kr-form";
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
import { Checkbox } from "@/components/atoms/Checkbox";

export const Route = createFileRoute("/kelola")({
  component: Kelola,
});

type DlgKind = "item" | "prio" | "staff";

interface DlgState {
  kind: DlgKind;
  title: string;
  edit?: AdminItem | Priority | Staff;
  form: Record<string, string>;
  errs: Record<string, string>;
}

type FieldDlgState = {
  mode: "add" | "edit";
  section: KrSection;
  sasaranKey?: SasaranKey;
  editId?: string;
  form: { label: string; kind: string; required: boolean; active: boolean; options: string; hint: string; sasaranSection: string };
  errs: Record<string, string>;
};

const TABS = [
  { key: "formkr", label: "Form KR" },
  // { key: "checklist", label: "Checklist (Legacy)" },
  { key: "prioritas", label: "Prioritas" },
  { key: "staff", label: "Staff" },
] as const;

const FORM_SUB_TABS = [
  { key: "keluarga", label: "Keluarga" },
  { key: "anggota", label: "Anggota" },
  { key: "sanitasi", label: "Sanitasi" },
  { key: "sasaran", label: "Sasaran" },
  { key: "masalah", label: "Masalah" },
  { key: "hasil", label: "Hasil" },
] as const;

const SASARAN_SECTION_OPTS: { value: KrSection; label: string }[] = [
  { value: "sasaran:identitas", label: "Identitas" },
  { value: "sasaran:kolom", label: "Kolom pemantauan" },
  { value: "sasaran:bools", label: "Kondisi / pelayanan" },
  { value: "sasaran:baha", label: "BaHa — tanda bahaya" },
];

function toVariant(w: string | undefined): TagVariant {
  const v = w?.startsWith("tag-") ? w.slice(4) : w;
  return (["odgj", "bumil", "balita", "tb", "stunt"] as const).includes(v as TagVariant) ? (v as TagVariant) : "odgj";
}

function CtlField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-ink">
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
      <span className={cn("text-[11px] font-semibold text-danger", !error && "hidden")}>{error || "Wajib diisi."}</span>
    </label>
  );
}

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
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

function Kelola() {
  const toast = useToast();
  const uid = useRef(Date.now());
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useLocalStorage<AdminItem[]>(STORAGE_KEYS.adminItems, seedAdminItems());
  const [prios, setPrios] = useLocalStorage<Priority[]>(STORAGE_KEYS.adminPrios, seedAdminPrios());
  const [staff, setStaff] = useLocalStorage<Staff[]>(STORAGE_KEYS.adminStaff, seedAdminStaff());
  const { templates, setTemplates, resetTemplates, exportJson, importJson } = useKrTemplates();

  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("formkr");
  const [curPrio, setCurPrio] = useState<string>(() => seedAdminPrios().find((p) => p.on)?.nama ?? "ODGJ");
  const [staffQ, setStaffQ] = useState("");
  const [staffF, setStaffF] = useState("all");
  const [dlg, setDlg] = useState<DlgState | null>(null);

  // Form KR states
  const [formSub, setFormSub] = useState<(typeof FORM_SUB_TABS)[number]["key"]>("keluarga");
  const [curSasaran, setCurSasaran] = useState<SasaranKey>("ibu-hamil");
  const [fieldDlg, setFieldDlg] = useState<FieldDlgState | null>(null);
  const [hasilEditIdx, setHasilEditIdx] = useState<number | null>(null);
  const [hasilEditVal, setHasilEditVal] = useState("");

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
      const payload = { nama, peran: dlg.form.peran, kel: dlg.form.kel, posy: dlg.form.posy, hp: dlg.form.hp };
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
    setDlg({ kind: "item", title: edit ? "Ubah butir" : `Tambah butir — ${curPrio}`, edit, form: { judul: edit?.judul ?? "", desk: edit?.desk ?? "" }, errs: {} });
  const openPrioDlg = (edit?: Priority) =>
    setDlg({ kind: "prio", title: edit ? "Ubah prioritas" : "Tambah prioritas", edit, form: { nama: edit?.nama ?? "", desk: edit?.desk ?? "", warna: toVariant(edit?.warna) }, errs: {} });
  const openStaffDlg = (edit?: Staff) =>
    setDlg({
      kind: "staff",
      title: edit ? "Ubah staff" : "Tambah staff",
      edit,
      form: { nama: edit?.nama ?? "", peran: edit?.peran ?? "Kader", kel: edit?.kel ?? KELS[0], posy: edit?.posy ?? "—", hp: edit?.hp ?? "" },
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

  // ── Form KR handlers ──
  const getFields = (): KrTemplateField[] => {
    if (formSub === "keluarga") return templates.keluargaInfo;
    if (formSub === "anggota") return templates.anggota;
    if (formSub === "sanitasi") return templates.sanitasi;
    if (formSub === "masalah") return templates.masalah;
    if (formSub === "sasaran") return templates.sasaran[curSasaran]?.fields ?? [];
    return [];
  };

  const setFieldsForSub = (next: KrTemplateField[]) => {
    if (formSub === "keluarga") setTemplates((t) => ({ ...t, keluargaInfo: next }));
    else if (formSub === "anggota") setTemplates((t) => ({ ...t, anggota: next }));
    else if (formSub === "sanitasi") setTemplates((t) => ({ ...t, sanitasi: next }));
    else if (formSub === "masalah") setTemplates((t) => ({ ...t, masalah: next }));
    else if (formSub === "sasaran") {
      setTemplates((t) => ({ ...t, sasaran: { ...t.sasaran, [curSasaran]: { ...t.sasaran[curSasaran], fields: next } } }));
    }
  };

  const moveField = (id: string, dir: -1 | 1) => {
    const fields = [...getFields()].sort((a, b) => a.order - b.order);
    const idx = fields.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= fields.length) return;
    const a = fields[idx], b = fields[swapIdx];
    const ao = a.order, bo = b.order;
    a.order = bo;
    b.order = ao;
    if (a.order === b.order) {
      // ensure distinct if same order
      b.order = ao + dir;
    }
    setFieldsForSub([...fields]);
    toast("Urutan diubah.");
  };

  const toggleFieldActive = (id: string, on: boolean) => {
    const fields = getFields().map((f) => (f.id === id ? { ...f, active: on } : f));
    setFieldsForSub(fields);
    toast(`Field ${on ? "diaktifkan" : "dinonaktifkan"}.`);
  };

  const deleteField = (f: KrTemplateField) => {
    if (!window.confirm(`Hapus field "${f.label}"? Data kader untuk field ini tidak tampil lagi.`)) return;
    const fields = getFields().filter((x) => x.id !== f.id);
    setFieldsForSub(fields);
    toast("Field dihapus.");
  };

  const openFieldDlg = (edit?: KrTemplateField) => {
    if (formSub === "hasil") return;
    if (formSub === "sasaran") {
      setFieldDlg({
        mode: edit ? "edit" : "add",
        section: edit?.section ?? "sasaran:identitas",
        sasaranKey: curSasaran,
        editId: edit?.id,
        form: {
          label: edit?.label ?? "",
          kind: edit?.kind ?? "text",
          required: edit?.required ?? false,
          active: edit?.active ?? true,
          options: (edit?.options ?? []).join(", "),
          hint: edit?.hint ?? "",
          sasaranSection: (edit?.section as string) ?? "sasaran:identitas",
        },
        errs: {},
      });
    } else {
      const sectionMap: Record<string, KrSection> = {
        keluarga: "keluargaInfo",
        anggota: "anggota",
        sanitasi: "sanitasi",
        masalah: "masalah",
      };
      const section = sectionMap[formSub] ?? "keluargaInfo";
      setFieldDlg({
        mode: edit ? "edit" : "add",
        section,
        editId: edit?.id,
        form: {
          label: edit?.label ?? "",
          kind: edit?.kind ?? (formSub === "sanitasi" ? "checkbox" : "text"),
          required: edit?.required ?? false,
          active: edit?.active ?? true,
          options: (edit?.options ?? []).join(", "),
          hint: edit?.hint ?? "",
          sasaranSection: "",
        },
        errs: {},
      });
    }
  };

  const saveFieldDlg = () => {
    if (!fieldDlg) return;
    const label = fieldDlg.form.label.trim();
    if (!label) {
      setFieldDlg((d) => ({ ...d!, errs: { label: "Wajib isi label." } }));
      return;
    }
    const kind = fieldDlg.form.kind as KrTemplateField["kind"];
    const required = fieldDlg.form.required;
    const active = fieldDlg.form.active;
    const hint = fieldDlg.form.hint.trim();
    let options: string[] | undefined;
    if (kind === "select") {
      const raw = fieldDlg.form.options
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (raw.length === 0) {
        setFieldDlg((d) => ({ ...d!, errs: { options: "Minimal 1 opsi untuk select." } }));
        return;
      }
      options = raw;
    }
    const currentFields = getFields();
    if (fieldDlg.mode === "add") {
      const id = createFieldId(label, currentFields);
      const section: KrSection =
        formSub === "sasaran" ? (fieldDlg.form.sasaranSection as KrSection) : fieldDlg.section;
      const newField: KrTemplateField = {
        id,
        label,
        kind,
        section,
        sasaranKey: formSub === "sasaran" ? curSasaran : undefined,
        required,
        active,
        order: getNextOrder(currentFields),
        options,
        hint: hint || undefined,
      };
      setFieldsForSub([...currentFields, newField]);
      toast("Field ditambah.");
    } else {
      const fields = currentFields.map((f) => {
        if (f.id !== fieldDlg.editId) return f;
        const section: KrSection =
          formSub === "sasaran" ? (fieldDlg.form.sasaranSection as KrSection) : f.section;
        return { ...f, label, kind, required, active, options: kind === "select" ? options : undefined, hint: hint || undefined, section };
      });
      setFieldsForSub(fields);
      toast("Field diubah.");
    }
    setFieldDlg(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importJson(file, (ok, msg) => {
      toast(msg);
      if (!ok) {
        // keep
      }
    });
    e.target.value = "";
  };

  const kindLabel = (k: string) => ({ text: "Teks", number: "Angka", date: "Tanggal", select: "Pilihan", checkbox: "Checkbox" }[k] ?? k);

  return (
    <AppShell>
      <PageHeader
        title="Kelola Master Data"
        description="Admin mengatur template checklist KR fleksibel, prioritas, dan akun staff. Perubahan langsung sinkron ke form kader."
      />

      <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <StatCard caption="Field KR aktif" value={templates.keluargaInfo.filter((f) => f.active).length + templates.anggota.filter((f) => f.active).length + templates.sanitasi.filter((f) => f.active).length + templates.masalah.filter((f) => f.active).length + Object.values(templates.sasaran).reduce((a, s) => a + s.fields.filter((f) => f.active).length, 0)} />
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

      {tab === "formkr" ? (
        <>
          <SectionCard
            title="Template Form KR"
            sub="Kelola field fleksibel untuk seluruh section kunjungan rumah. Field nonaktif disembunyikan dari kader, field dihapus hilang sinkron."
            actions={
              <Toolbar className="w-full flex-wrap">
                <Button size="sm" variant="primary" onClick={() => openFieldDlg()}>
                  + Tambah field
                </Button>
                <Button size="sm" onClick={() => fileRef.current?.click()}>
                  Import JSON
                </Button>
                <Button size="sm" onClick={exportJson}>
                  Export JSON
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (!window.confirm("Reset template ke default? Semua kustom field hilang.")) return;
                    resetTemplates();
                    toast("Template direset ke default.");
                  }}
                >
                  Reset default
                </Button>
              </Toolbar>
            }
          >
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <div className="mt-3 flex flex-wrap gap-2">
              {FORM_SUB_TABS.map((s) => (
                <Tab key={s.key} active={formSub === s.key} onClick={() => setFormSub(s.key as never)} role="tab" aria-selected={formSub === s.key}>
                  {s.label}
                </Tab>
              ))}
            </div>

            {formSub === "sasaran" ? (
              <div className="mt-3">
                <ChipGroup
                  options={SASARAN_KEYS.map((k) => ({ value: k, label: templates.sasaran[k]?.label ?? k }))}
                  selected={curSasaran}
                  onToggle={(v) => setCurSasaran(v as SasaranKey)}
                />
                <div className="mt-3 rounded-lg border border-line bg-surface-2 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={templates.sasaran[curSasaran]?.label ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setTemplates((t) => ({ ...t, sasaran: { ...t.sasaran, [curSasaran]: { ...t.sasaran[curSasaran], label: v } } }));
                      }}
                      className="max-w-[260px]"
                      placeholder="Label sasaran"
                    />
                    <span className="text-xs text-muted">{templates.sasaran[curSasaran]?.fields.length ?? 0} field</span>
                  </div>
                  <div className="mt-2 text-[11px] text-muted">Prioritas default untuk {curSasaran}:</div>
                  <ChipGroup
                    className="mt-1"
                    options={PRIOS.map((p) => ({ value: p, label: p }))}
                    selected={templates.sasaran[curSasaran]?.prioritasDefault ?? []}
                    onToggle={(v) => {
                      setTemplates((t) => {
                        const cur = t.sasaran[curSasaran].prioritasDefault;
                        const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
                        return { ...t, sasaran: { ...t.sasaran, [curSasaran]: { ...t.sasaran[curSasaran], prioritasDefault: next } } };
                      });
                    }}
                  />
                </div>
              </div>
            ) : null}

            {formSub === "hasil" ? (
              <div className="mt-3 grid gap-2">
                <Toolbar>
                  <span className="text-xs text-muted">{templates.hasilOpsi.length} opsi hasil kunjungan</span>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      const v = window.prompt("Label opsi baru:", "");
                      if (!v || !v.trim()) return;
                      if (templates.hasilOpsi.includes(v.trim())) {
                        toast("Opsi sudah ada.");
                        return;
                      }
                      setTemplates((t) => ({ ...t, hasilOpsi: [...t.hasilOpsi, v.trim()] }));
                      toast("Opsi ditambah.");
                    }}
                  >
                    + Tambah opsi
                  </Button>
                </Toolbar>
                {templates.hasilOpsi.map((opsi, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-[10px] border border-line bg-surface p-3">
                    <b className="flex-1 text-[13px]">{opsi}</b>
                    {hasilEditIdx === idx ? (
                      <>
                        <Input value={hasilEditVal} onChange={(e) => setHasilEditVal(e.target.value)} className="max-w-[200px]" />
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            const v = hasilEditVal.trim();
                            if (!v) {
                              toast("Label tidak boleh kosong.");
                              return;
                            }
                            setTemplates((t) => {
                              const next = [...t.hasilOpsi];
                              next[idx] = v;
                              return { ...t, hasilOpsi: next };
                            });
                            setHasilEditIdx(null);
                            toast("Opsi diubah.");
                          }}
                        >
                          Simpan
                        </Button>
                        <Button size="sm" onClick={() => setHasilEditIdx(null)}>
                          Batal
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setHasilEditIdx(idx);
                            setHasilEditVal(opsi);
                          }}
                        >
                          Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (!window.confirm(`Hapus opsi "${opsi}"?`)) return;
                            setTemplates((t) => ({ ...t, hasilOpsi: t.hasilOpsi.filter((_, i) => i !== idx) }));
                            toast("Opsi dihapus.");
                          }}
                        >
                          Hapus
                        </Button>
                      </>
                    )}
                    <div className="flex gap-1">
                      <Button size="sm" disabled={idx === 0} onClick={() => {
                        setTemplates((t) => {
                          const next = [...t.hasilOpsi];
                          const tmp = next[idx - 1];
                          next[idx - 1] = next[idx];
                          next[idx] = tmp;
                          return { ...t, hasilOpsi: next };
                        });
                      }}>
                        ↑
                      </Button>
                      <Button size="sm" disabled={idx === templates.hasilOpsi.length - 1} onClick={() => {
                        setTemplates((t) => {
                          const next = [...t.hasilOpsi];
                          const tmp = next[idx + 1];
                          next[idx + 1] = next[idx];
                          next[idx] = tmp;
                          return { ...t, hasilOpsi: next };
                        });
                      }}>
                        ↓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                {(() => {
                  const fields = [...getFields()].sort((a, b) => a.order - b.order);
                  if (fields.length === 0) return <EmptyState>Belum ada field — klik Tambah field.</EmptyState>;
                  return fields.map((f) => (
                    <div key={f.id} className={`flex items-start gap-3 rounded-[10px] border border-line p-3 ${!f.active ? "bg-surface-2 opacity-60" : "bg-surface"}`}>
                      <div className="min-w-0 flex-1">
                        <b className="block text-[13px]">
                          {f.label} {f.required ? <span className="text-danger">*</span> : null}
                        </b>
                        <small className="mt-0.5 block text-xs text-muted">
                          {f.id} · {kindLabel(f.kind)} · {f.section}
                          {f.options ? ` · opsi: ${f.options.join(", ")}` : ""}
                          {f.hint ? ` · hint: ${f.hint}` : ""}
                        </small>
                      </div>
                      <div className="flex flex-none flex-wrap items-center justify-end gap-1.5">
                        <Button size="sm" onClick={() => moveField(f.id, -1)}>
                          ↑
                        </Button>
                        <Button size="sm" onClick={() => moveField(f.id, 1)}>
                          ↓
                        </Button>
                        <label className="flex items-center gap-1 text-xs">
                          <Checkbox checked={!!f.active} onChange={(e) => toggleFieldActive(f.id, e.target.checked)} />
                          Aktif
                        </label>
                        <Button size="sm" onClick={() => openFieldDlg(f)}>
                          Ubah
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deleteField(f)}>
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </SectionCard>

          {fieldDlg ? (
            <Modal title={fieldDlg.mode === "add" ? "Tambah field" : "Ubah field"} onClose={() => setFieldDlg(null)} onSave={saveFieldDlg}>
              <CtlField label="Label field" required error={fieldDlg.errs.label}>
                <Input value={fieldDlg.form.label} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, label: e.target.value }, errs: { ...d!.errs, label: "" } }))} placeholder="cth. Suhu tubuh (°C)" />
              </CtlField>
              {formSub === "sasaran" ? (
                <CtlField label="Section sasaran">
                  <Select value={fieldDlg.form.sasaranSection} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, sasaranSection: e.target.value } }))}>
                    {SASARAN_SECTION_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </CtlField>
              ) : null}
              <CtlField label="Jenis input">
                <Select value={fieldDlg.form.kind} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, kind: e.target.value } }))}>
                  <option value="text">Teks</option>
                  <option value="number">Angka</option>
                  <option value="date">Tanggal</option>
                  <option value="select">Pilihan (select)</option>
                  <option value="checkbox">Checkbox</option>
                </Select>
              </CtlField>
              {fieldDlg.form.kind === "select" ? (
                <CtlField label="Opsi (pisah koma)" required error={fieldDlg.errs.options}>
                  <Textarea
                    value={fieldDlg.form.options}
                    onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, options: e.target.value }, errs: { ...d!.errs, options: "" } }))}
                    placeholder="cth. Ya, Tidak atau L, P"
                  />
                </CtlField>
              ) : null}
              <CtlField label="Hint / placeholder (opsional)">
                <Input value={fieldDlg.form.hint} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, hint: e.target.value } }))} placeholder="cth. 16 digit, tanpa spasi." />
              </CtlField>
              <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Checkbox checked={fieldDlg.form.required} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, required: e.target.checked } }))} />
                Wajib diisi
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Checkbox checked={fieldDlg.form.active} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, active: e.target.checked } }))} />
                Aktif (tampil di form kader)
              </label>
            </Modal>
          ) : null}
        </>
      ) : null}

      {/* {tab === "checklist" ? (
        <SectionCard title="Template checklist per prioritas (Legacy)" sub="Pilih prioritas, lalu tambah, ubah, nonaktifkan, atau hapus butir. Tidak sinkron ke Form KR baru.">
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
      ) : null} */}

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
      ) : null}

      {tab === "staff" ? (
        <SectionCard title="Daftar staff & kader" sub="Nonaktifkan akun yang sudah tidak bertugas — data tidak dihapus permanen.">
          <Toolbar>
            <Button size="sm" variant="primary" onClick={() => openStaffDlg()}>
              + Tambah staff
            </Button>
            <Input value={staffQ} onChange={(e) => setStaffQ(e.target.value)} placeholder="Cari nama…" aria-label="Cari staff" className="max-w-55" />
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
            renderMobileRow={(s, i) => (
              <div key={i} className="border-b border-[var(--color-surface-2)] last:border-none px-3.5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{s.nama}</div>
                    <div className="text-[11px] text-muted">{s.peran} · Kel. {s.kel} · {s.posy}</div>
                  </div>
                  <StatusBadge variant={s.on ? "on" : "off"} value={s.on ? "Aktif" : "Nonaktif"} />
                </div>
                <div className="mt-1 text-[11px] text-muted">{s.hp}</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => openStaffDlg(s)}>Ubah</Button>
                  <Button size="sm" onClick={() => toggleStaff(s)}>
                    {s.on ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              </div>
            )}
          />
        </SectionCard>
      ) : null}

      {dlg ? (
        <Modal title={dlg.title} onClose={() => setDlg(null)} onSave={saveDlg}>
          {dlg.kind === "item" ? (
            <>
              <CtlField label="Judul butir" required error={dlg.errs.judul}>
                <Input value={dlg.form.judul} onChange={(e) => setForm("judul", e.target.value)} invalid={!!dlg.errs.judul} placeholder="cth. Minum obat rutin" />
              </CtlField>
              <CtlField label="Penjelasan">
                <Textarea value={dlg.form.desk} onChange={(e) => setForm("desk", e.target.value)} placeholder="cth. Obat diminum sesuai jadwal…" />
              </CtlField>
            </>
          ) : null}
          {dlg.kind === "prio" ? (
            <>
              <CtlField label="Nama prioritas" required error={dlg.errs.nama}>
                <Input value={dlg.form.nama} onChange={(e) => setForm("nama", e.target.value)} invalid={!!dlg.errs.nama} placeholder="cth. Lansia Risti" />
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
                <Input value={dlg.form.nama} onChange={(e) => setForm("nama", e.target.value)} invalid={!!dlg.errs.nama} placeholder="cth. Ibu Warsini" />
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
                <Input value={dlg.form.hp} onChange={(e) => setForm("hp", e.target.value)} placeholder="cth. 0812xxxx" type="tel" />
              </CtlField>
            </>
          ) : null}
        </Modal>
      ) : null}
    </AppShell>
  );
}
