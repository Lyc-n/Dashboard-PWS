import { useRef, useState } from "react";
import { createFieldId, getNextOrder } from "@/lib/kr-templates";
import type { KrSection, KrTemplateField, KrTemplates } from "@/lib/kr-templates";
import { SASARAN_KEYS } from "@/lib/kr-form";
import type { SasaranKey } from "@/lib/kr-form";
import { PRIOS } from "@/lib/constants";
import { useToast } from "@/providers/toast";
import { SectionCard } from "@/components/molecules/SectionCard";
import { ChipGroup } from "@/components/molecules/ChipGroup";
import { FormField } from "@/components/molecules/FormField";
import { Toolbar } from "@/components/molecules/Toolbar";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Button } from "@/components/atoms/Button";
import { Tab } from "@/components/atoms/Tab";
import { EmptyState } from "@/components/atoms/EmptyState";
import { Checkbox } from "@/components/atoms/Checkbox";
import { FORM_SUB_TABS, SASARAN_SECTION_OPTS, kindLabel } from "@/features/kelola/types";
import type { FieldDlgState, FormSubTab } from "@/features/kelola/types";
import { AdminModal } from "@/features/kelola/components/AdminModal";

interface Props {
  templates: KrTemplates;
  setTemplates: React.Dispatch<React.SetStateAction<KrTemplates>>;
  resetTemplates: () => void;
  exportJson: () => void;
  importJson: (file: File, onDone?: (ok: boolean, msg: string) => void) => void;
}

export function FormKrSection({ templates, setTemplates, resetTemplates, exportJson, importJson }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [formSub, setFormSub] = useState<FormSubTab>("keluarga");
  const [curSasaran, setCurSasaran] = useState<SasaranKey>("ibu-hamil");
  const [fieldDlg, setFieldDlg] = useState<FieldDlgState | null>(null);
  const [hasilEditIdx, setHasilEditIdx] = useState<number | null>(null);
  const [hasilEditVal, setHasilEditVal] = useState("");

  const getFields = (): KrTemplateField[] => {
    if (formSub === "keluarga") return templates.keluargaInfo;
    if (formSub === "anggota") return templates.anggota;
    if (formSub === "sanitasi") return templates.sanitasi;
    if (formSub === "masalah") return templates.masalah;
    if (formSub === "sasaran") return templates.sasaran[curSasaran].fields;
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
          sasaranSection: edit?.section ?? "sasaran:identitas",
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

  return (
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
            <Tab key={s.key} active={formSub === s.key} onClick={() => setFormSub(s.key)} role="tab" aria-selected={formSub === s.key}>
              {s.label}
            </Tab>
          ))}
        </div>

        {formSub === "sasaran" ? (
          <div className="mt-3">
            <ChipGroup
              options={SASARAN_KEYS.map((k) => ({ value: k, label: templates.sasaran[k].label }))}
              selected={curSasaran}
              onToggle={(v) => setCurSasaran(v as SasaranKey)}
            />
            <div className="mt-3 rounded-lg border border-line bg-surface-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={templates.sasaran[curSasaran].label}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTemplates((t) => ({ ...t, sasaran: { ...t.sasaran, [curSasaran]: { ...t.sasaran[curSasaran], label: v } } }));
                  }}
                  className="max-w-[260px]"
                  placeholder="Label sasaran"
                />
                <span className="text-xs text-muted">{templates.sasaran[curSasaran].fields.length} field</span>
              </div>
              <div className="mt-2 text-[11px] text-muted">Prioritas default untuk {curSasaran}:</div>
              <ChipGroup
                className="mt-1"
                options={PRIOS.map((p) => ({ value: p, label: p }))}
                selected={templates.sasaran[curSasaran].prioritasDefault}
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
        <AdminModal title={fieldDlg.mode === "add" ? "Tambah field" : "Ubah field"} onClose={() => setFieldDlg(null)} onSave={saveFieldDlg}>
          <FormField label="Label field" required error={fieldDlg.errs.label || "Wajib diisi."} invalid={!!fieldDlg.errs.label}>
            <Input value={fieldDlg.form.label} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, label: e.target.value }, errs: { ...d!.errs, label: "" } }))} placeholder="cth. Suhu tubuh (°C)" />
          </FormField>
          {formSub === "sasaran" ? (
            <FormField label="Section sasaran">
              <Select value={fieldDlg.form.sasaranSection} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, sasaranSection: e.target.value } }))}>
                {SASARAN_SECTION_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}
          <FormField label="Jenis input">
            <Select value={fieldDlg.form.kind} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, kind: e.target.value } }))}>
              <option value="text">Teks</option>
              <option value="number">Angka</option>
              <option value="date">Tanggal</option>
              <option value="select">Pilihan (select)</option>
              <option value="checkbox">Checkbox</option>
            </Select>
          </FormField>
          {fieldDlg.form.kind === "select" ? (
            <FormField label="Opsi (pisah koma)" required error={fieldDlg.errs.options || "Wajib diisi."} invalid={!!fieldDlg.errs.options}>
              <Textarea
                value={fieldDlg.form.options}
                onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, options: e.target.value }, errs: { ...d!.errs, options: "" } }))}
                placeholder="cth. Ya, Tidak atau L, P"
              />
            </FormField>
          ) : null}
          <FormField label="Hint / placeholder (opsional)">
            <Input value={fieldDlg.form.hint} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, hint: e.target.value } }))} placeholder="cth. 16 digit, tanpa spasi." />
          </FormField>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Checkbox checked={fieldDlg.form.required} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, required: e.target.checked } }))} />
            Wajib diisi
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Checkbox checked={fieldDlg.form.active} onChange={(e) => setFieldDlg((d) => ({ ...d!, form: { ...d!.form, active: e.target.checked } }))} />
            Aktif (tampil di form kader)
          </label>
        </AdminModal>
      ) : null}
    </>
  );
}
