import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useKunjungan } from "@/hooks/use-kunjungan";
import { useKrTemplates } from "@/hooks/use-kr-templates";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { PRIOS, STORAGE_KEYS } from "@/lib/constants";
import type { SasaranKey } from "@/lib/kr-form";
import type { KrTemplateField } from "@/lib/kr-templates";
import { fmtDate } from "@/lib/utils";
import { useToast } from "@/providers/toast";
import { AppShell } from "@/components/organisms/AppShell";
import { DetailHeader } from "@/components/organisms/DetailHeader";
import { HistoryPanel } from "@/components/organisms/HistoryPanel";
import { SuccessPanel } from "@/components/organisms/SuccessPanel";
import { SectionCard } from "@/components/molecules/SectionCard";
import { Stepper  } from "@/components/molecules/Stepper";
import type {Step} from "@/components/molecules/Stepper";
import { FillBar } from "@/components/molecules/FillBar";
import { HistoryRow } from "@/components/molecules/HistoryRow";
import { FormField } from "@/components/molecules/FormField";
import { ChipGroup } from "@/components/molecules/ChipGroup";
import { Toolbar } from "@/components/molecules/Toolbar";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Checkbox } from "@/components/atoms/Checkbox";
import { RadioCard } from "@/components/atoms/RadioCard";
import { Button } from "@/components/atoms/Button";
import { Tag } from "@/components/atoms/Tag";
import { requireAuth } from "@/lib/auth";

type KunjunganRecord = NonNullable<ReturnType<ReturnType<typeof useKunjungan>["submit"]>>;

export const Route = createFileRoute("/checklist")({
  beforeLoad: requireAuth,
  component: Checklist,
});

function Checklist() {
  const { templates } = useKrTemplates();
  const k = useKunjungan(templates);
  const toast = useToast();
  const [records, setRecords] = useLocalStorage<KunjunganRecord[]>(STORAGE_KEYS.checklist, []);
  const [saved, setSaved] = useState<KunjunganRecord | null>(null);

  const steps: Step[] = [
    { label: "Data Keluarga", state: k.stepState[0] },
    { label: "Sasaran", state: k.stepState[1] },
    { label: "Form Sasaran", state: k.stepState[2] },
    { label: "Hasil & Tindak", state: k.stepState[3] },
  ];

  const handleSubmit = () => {
    const r = k.submit();
    if (!r) {
      toast("Periksa kembali isian yang wajib diisi.");
      return;
    }
    setRecords((prev) => [...prev, r]);
    setSaved(r);
    toast(`Kunjungan ${r.info.namaKK || "keluarga"} tersimpan.`);
  };

  const handleNext = () => {
    k.reset();
    setSaved(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const keluargaInfoFields = templates.keluargaInfo.filter((f) => f.active).sort((a, b) => a.order - b.order);
  const anggotaFields = templates.anggota.filter((f) => f.active).sort((a, b) => a.order - b.order);
  const sanitasiFields = templates.sanitasi.filter((f) => f.active).sort((a, b) => a.order - b.order);
  const sanitasiChecks = sanitasiFields.filter((f) => f.kind === "checkbox");
  const sanitasiSelects = sanitasiFields.filter((f) => f.kind === "select");
  const masalahFields = templates.masalah.filter((f) => f.active).sort((a, b) => a.order - b.order);
  const hasilOpsi = templates.hasilOpsi;

  return (
    <AppShell>
      <PageHeader
        title="Input Checklist"
        description="Checklist Kunjungan Rumah (KR) — form fleksibel diatur Admin di Kelola. Disimpan di perangkat ini."
      />

      <DetailHeader
        title="Checklist Kunjungan Rumah — GERMAS 2024"
        meta="Data keluarga & anggota dulu, lalu pilih sasaran untuk penilaian. Periksa ulang sebelum menyimpan."
      />

      <Stepper steps={steps} />
      <FillBar pct={k.fillPercent} />

      <SectionCard title="1. Data Keluarga & Anggota" sub="Informasi tempat, KK, anggota keluarga, dan sanitasi/lingkungan rumah.">
        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {keluargaInfoFields.map((f) => {
            const val = (k.info as Record<string, string>)[f.id] ?? "";
            const invKey = f.id;
            const legacyInv = f.id === "tglPengumpulan" ? k.invalid.tgl : f.id === "posyandu" ? k.invalid.posyandu : false;
            const invalid = !!k.invalid[invKey] || legacyInv;
            return (
              <FormField key={f.id} label={f.label} required={f.required} invalid={invalid} error={f.required ? "Wajib diisi." : undefined} hint={f.hint}>
                {f.kind === "date" ? (
                  <Input type="date" value={val} onChange={(e) => k.setField(f.id as never, e.target.value)} invalid={invalid} />
                ) : f.kind === "select" ? (
                  <Select value={val} onChange={(e) => k.setField(f.id as never, e.target.value)}>
                    <option value="">— Pilih —</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={val}
                    onChange={(e) => k.setField(f.id as never, e.target.value)}
                    placeholder={PLACEHOLDER[f.id] ?? ""}
                    invalid={invalid}
                  />
                )}
              </FormField>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink">
              Anggota keluarga <span className="text-danger">*</span>
              <span className="ml-2 font-normal text-muted">jumlah: {k.anggota.length}</span>
            </span>
            <Button variant="ghost" onClick={k.addAnggota}>
              + Tambah anggota
            </Button>
          </div>
          {k.invalid.anggota ? <span className="mt-1 block text-[11px] font-semibold text-danger">Minimal 1 anggota keluarga.</span> : null}
          <div className="grid gap-3">
            {k.anggota.map((m, i) => (
              <div key={m.id} className="rounded-[10px] border border-line bg-surface p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-ink">Anggota {i + 1}</span>
                  <button type="button" onClick={() => k.removeAnggota(m.id)} className="text-muted hover:text-danger" aria-label="Hapus anggota">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                  {anggotaFields.map((f) => {
                    const val = (m as unknown as Record<string, string>)[f.id] ?? "";
                    const invalid = !!k.invalid[`${f.id}:${m.id}`];
                    // NIK special handling
                    if (f.id === "nik") {
                      return (
                        <FormField key={f.id} label={f.label} required={f.required} hint={f.hint ?? "16 digit, tanpa spasi."} invalid={invalid} error={f.required ? "Wajib 16 digit & unik." : undefined}>
                          <Input
                            value={val}
                            onChange={(e) => k.updateAnggota(m.id, f.id as never, e.target.value.replace(/\D/g, "").slice(0, 16))}
                            inputMode="numeric"
                            placeholder="3579…………"
                            invalid={invalid}
                          />
                        </FormField>
                      );
                    }
                    if (f.kind === "select") {
                      return (
                        <FormField key={f.id} label={f.label} required={f.required} invalid={invalid} error="Wajib diisi." hint={f.hint}>
                          <Select value={val} onChange={(e) => k.updateAnggota(m.id, f.id as never, e.target.value)}>
                            <option value="">— Pilih —</option>
                            {(f.options ?? []).map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </Select>
                        </FormField>
                      );
                    }
                    if (f.kind === "date") {
                      return (
                        <FormField key={f.id} label={f.label} required={f.required} invalid={invalid} error="Wajib diisi." hint={f.hint}>
                          <Input type="date" value={val} onChange={(e) => k.updateAnggota(m.id, f.id as never, e.target.value)} invalid={invalid} />
                        </FormField>
                      );
                    }
                    return (
                      <FormField key={f.id} label={f.label} required={f.required} invalid={invalid} error="Wajib diisi." hint={f.hint}>
                        <Input value={val} onChange={(e) => k.updateAnggota(m.id, f.id as never, e.target.value)} placeholder={f.id === "nama" ? "cth. Budi Setiawan" : ""} invalid={invalid} />
                      </FormField>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-1.5">
          <span className="text-xs font-semibold text-ink">Sanitasi / lingkungan keluarga</span>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 max-md:grid-cols-2 max-sm:grid-cols-1">
            {sanitasiChecks.map((f) => (
              <label key={f.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox
                  checked={Boolean((k.sanitasi as Record<string, unknown>)[f.id])}
                  onChange={(e) => k.setSanField(f.id as never, e.target.checked)}
                />
                {f.label}
                {f.required ? <span className="text-danger">*</span> : null}
              </label>
            ))}
            {sanitasiSelects.map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-[13px]">
                <span className="text-muted">{f.label}</span>
                <Select
                  value={String((k.sanitasi as Record<string, unknown>)[f.id] ?? "")}
                  onChange={(e) => k.setSanField(f.id as never, e.target.value)}
                  className="max-w-44 py-1 text-xs"
                >
                  <option value="">— Pilih —</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </label>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="2. Sasaran yang Diperiksa" sub="Pilih 1 atau lebih kelompok sasaran untuk tiap anggota yang dinilai.">
        {k.anggota.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-line p-4 text-center text-[13px] text-muted">
            Tambah anggota keluarga dulu di step 1 untuk mulai penilaian.
          </div>
        ) : (
          <div className="grid gap-4">
            {k.anggota.map((m) => {
              const memberPeni = k.penilaian.filter((p) => p.anggotaId === m.id);
              return (
                <div key={m.id} className="rounded-[10px] border border-line bg-surface p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <b className="text-[13px]">{m.nama || "Anggota"}</b>
                    <span className="text-[11px] text-muted">NIK {m.nik || "—"} · {m.tglLahir || "tgl lahir belum diisi"}</span>
                    <span className="ml-auto text-[11px] text-muted">{memberPeni.length} penilaian</span>
                  </div>
                  <ChipGroup
                    options={Object.entries(templates.sasaran).map(([key, tpl]) => ({
                      value: key,
                      label: SASARAN_LABEL_SHORT[key as SasaranKey] ?? tpl.label,
                    }))}
                    selected={memberPeni.map((p) => p.sasaran)}
                    onToggle={(v) => {
                      const key = v as SasaranKey;
                      const existing = memberPeni.find((p) => p.sasaran === key);
                      if (existing) k.removePenilaian(existing.id);
                      else k.addPenilaian(m.id, key);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
        {k.invalid.penilaian ? <span className="mt-2 block text-[11px] font-semibold text-danger">Pilih minimal 1 sasaran untuk diperiksa.</span> : null}
      </SectionCard>

      <SectionCard
        title="3. Form Sasaran"
        sub="Isi identitas, hasil pemeriksaan, kondisi teramati, dan tanda bahaya sesuai Definisi Operasional."
        actions={<span className="text-xs text-muted">{k.penilaian.length} penilaian · {k.bahaCount} tanda bahaya dicentang</span>}
      >
        {k.penilaian.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-line p-4 text-center text-[13px] text-muted">Belum ada sasaran dipilih di step 2.</div>
        ) : (
          <div className="grid gap-4">
            {k.penilaian.map((p) => (
              <SasaranForm key={p.id} p={p} k={k} templates={templates} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="4. Hasil, Prioritas & Tindak Lanjut" sub="Label prioritas program, masalah ditemukan, hasil kunjungan, dan tanda tangan kader.">
        {k.penilaian.length > 0 ? (
          <div className="grid gap-3">
            {k.penilaian.map((p) => {
              const anggota = k.anggota.find((a) => a.id === p.anggotaId);
              const label = templates.sasaran[p.sasaran].label;
              return (
                <div key={p.id} className="rounded-[10px] border border-line bg-surface p-3">
                  <div className="mb-2 text-xs font-semibold text-ink">
                    {label} · {anggota?.nama || "—"}
                  </div>
                  <div className="text-[11px] text-muted">Prioritas program (drive dashboard):</div>
                  <ChipGroup
                    options={PRIOS.map((prio) => ({ value: prio, label: prio }))}
                    selected={p.prioritas}
                    onToggle={(v) => k.togglePrioritas(p.id, v)}
                    className="mt-1.5"
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-ink">Masalah & tindak lanjut (per sasaran)</span>
            <Button variant="ghost" onClick={k.addMasalah}>
              + Tambah masalah
            </Button>
          </div>
          <div className="grid gap-3">
            {k.masalah.map((m) => (
              <div key={m.id} className="rounded-[10px] border border-line bg-surface p-3">
                <div className="mb-2 flex items-center justify-end">
                  <button type="button" onClick={() => k.removeMasalah(m.id)} className="text-muted hover:text-danger" aria-label="Hapus masalah">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                  {masalahFields.map((f) => {
                    const val = (m as unknown as Record<string, string>)[f.id] ?? "";
                    const invalid = !!k.invalid[`masalah:${m.id}:${f.id}`];
                    return (
                      <FormField key={f.id} label={f.label} required={f.required} invalid={invalid} error="Wajib diisi." hint={f.hint} className={f.id === "masalah" || f.id === "tindakLanjut" ? "col-span-2" : ""}>
                        {f.kind === "date" ? (
                          <Input type="date" value={val} onChange={(e) => k.updateMasalah(m.id, f.id as never, e.target.value)} invalid={invalid} />
                        ) : f.kind === "select" ? (
                          <Select value={val} onChange={(e) => k.updateMasalah(m.id, f.id as never, e.target.value)}>
                            <option value="">— Pilih —</option>
                            {(f.options ?? []).map((o) => (
                              <option key={o}>{o}</option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            value={val}
                            onChange={(e) => k.updateMasalah(m.id, f.id as never, e.target.value)}
                            placeholder={f.id === "masalah" ? "cth. Hipertensi tidak patuh berobat" : f.id === "tindakLanjut" ? "cth. Edukasi & jadwal kontrol" : ""}
                            invalid={invalid}
                          />
                        )}
                      </FormField>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {hasilOpsi.map((h) => (
            <RadioCard
              key={h}
              title={h}
              description={h === hasilOpsi[1] ? "Butuh jadwal ulang" : h === hasilOpsi[2] ? "Butuh rujukan" : "Tidak ada masalah berarti"}
              inputProps={{ name: "hasil", checked: k.hasil === h, onChange: () => k.setHasil(h) }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">
          <FormField label={k.hasil === hasilOpsi[1] ? "Jadwal ulang" : "Jadwal kontrol berikutnya"} required={k.hasil === hasilOpsi[1]} invalid={!!k.invalid.jadwal} error="Wajib isi jadwal.">
            <Input type="date" value={k.jadwal} onChange={(e) => k.setJadwal(e.target.value)} invalid={!!k.invalid.jadwal} />
          </FormField>
          <FormField label="TTD / nama jelas kader" required invalid={!!k.invalid.ttd} error="Wajib diisi.">
            <Input value={k.ttd} onChange={(e) => k.setTtd(e.target.value)} placeholder="cth. Siti Aminah" invalid={!!k.invalid.ttd} />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Simpan"
        actions={
          <Toolbar className="w-full">
            <span className="ml-auto text-xs text-muted">Simpan ke riwayat lokal perangkat ini.</span>
            <Button variant="default" onClick={k.reset}>
              Reset
            </Button>
            <Button variant="ghost" onClick={k.fillDemo}>
              Isi contoh
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Simpan checklist
            </Button>
          </Toolbar>
        }
      >
        <span className="text-xs text-muted">Pastikan seluruh isian wajib bercentang hijau sebelum menyimpan.</span>
      </SectionCard>

      {saved ? (
        <SuccessPanel title={`Kunjungan ${saved.info.namaKK || "keluarga"} tersimpan.`} message={`${saved.penilaian.length} penilaian sasaran · ${saved.masalah.length} masalah tercatat. Kader dapat melanjutkan ke keluarga berikutnya.`}>
          <Button variant="primary" onClick={handleNext}>
            Isi keluarga berikutnya
          </Button>
          <Link to="/sasaran" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-4.5 py-2.75 text-[13px] font-bold text-white hover:bg-accent-hover">
            Lihat Data Sasaran
          </Link>
        </SuccessPanel>
      ) : null}

      <SectionCard title="Riwayat Kunjungan" sub="Data tersimpan di perangkat ini." bodyClassName={undefined}>
        <HistoryPanel
          items={records.map((r, i) => (
            <HistoryRow key={i} layout="stack">
              <div className="flex flex-wrap items-center gap-2">
                <b>{r.info.namaKK || "Tanpa nama KK"}</b>
                {r.penilaian.map((p) => (
                  <Tag key={p.id}>{templates.sasaran[p.sasaran].label}</Tag>
                ))}
                {r.penilaian.flatMap((p) => p.prioritas).map((prio, j) => (
                  <Tag key={`${prio}-${j}`} priority={prio} />
                ))}
                <span className="text-muted">{fmtDate(r.info.tglPengumpulan)}</span>
              </div>
              <span className="text-muted">
                Posyandu {r.info.posyandu} · Kel. {r.info.kelurahan} · {r.anggota.length} anggota · hasil: {r.hasil}
              </span>
              <span className="text-muted">
                {r.penilaian.length} penilaian sasaran · {r.masalah.length} masalah · kader {r.ttd}
              </span>
            </HistoryRow>
          ))}
        />
      </SectionCard>
    </AppShell>
  );
}

function SasaranForm({
  p,
  k,
  templates,
}: {
  p: ReturnType<typeof useKunjungan>["penilaian"][number];
  k: ReturnType<typeof useKunjungan>;
  templates: ReturnType<typeof useKrTemplates>["templates"];
}) {
  const tpl = templates.sasaran[p.sasaran];
  const label = tpl.label;
  const anggota = k.anggota.find((a) => a.id === p.anggotaId);
  const fields = tpl.fields.filter((f) => f.active).sort((a, b) => a.order - b.order);
  const identitas = fields.filter((f) => f.section === "sasaran:identitas");
  const kolom = fields.filter((f) => f.section === "sasaran:kolom");
  const bools = fields.filter((f) => f.section === "sasaran:bools");
  const baha = fields.filter((f) => f.section === "sasaran:baha");

  return (
    <div className="rounded-[10px] border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <b className="text-[13px]">{label}</b>
          <span className="text-[11px] text-muted">Anggota: {anggota?.nama || "—"}</span>
        </div>
        <button type="button" onClick={() => k.removePenilaian(p.id)} className="text-muted hover:text-danger" aria-label="Hapus penilaian">
          <X size={16} />
        </button>
      </div>

      {identitas.length > 0 ? (
        <div className="grid gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Identitas</span>
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {identitas.map((f) => (
              <FieldCell key={f.id} field={f} value={p.values[f.id] ?? ""} invalid={!!k.invalid[`${p.id}:${f.id}`]} onChange={(v) => k.setValue(p.id, f.id, v)} />
            ))}
          </div>
        </div>
      ) : null}

      {kolom.length > 0 ? (
        <div className="mt-3 grid gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kolom pemantauan</span>
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {kolom.map((f) => (
              <FieldCell key={f.id} field={f} value={p.values[f.id] ?? ""} invalid={!!k.invalid[`${p.id}:${f.id}`]} onChange={(v) => k.setValue(p.id, f.id, v)} />
            ))}
          </div>
        </div>
      ) : null}

      {bools.length > 0 ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kondisi / pelayanan</span>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 max-md:grid-cols-2 max-sm:grid-cols-1">
            {bools.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox
                  checked={p.checks[b.id] ?? false}
                  onChange={(e) => k.setCheck(p.id, b.id, e.target.checked)}
                  aria-label={b.label}
                />
                {b.label}
                {b.required ? <span className="text-danger">*</span> : null}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {baha.length > 0 ? (
        <div className="mt-3 grid gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">BaHa — tanda bahaya</span>
            <span className="text-[11px] text-muted">
              {baha.filter((b) => p.checks[b.id]).length}/{baha.length} ada
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-sm:grid-cols-1">
            {baha.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox
                  checked={p.checks[b.id] ?? false}
                  onChange={(e) => k.setCheck(p.id, b.id, e.target.checked)}
                  className={p.checks[b.id] ? "!border-danger-border" : ""}
                />
                {b.label}
                {b.required ? <span className="text-danger">*</span> : null}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldCell({
  field,
  value,
  invalid,
  onChange,
}: {
  field: KrTemplateField;
  value: string;
  invalid?: boolean;
  onChange: (v: string) => void;
}) {
  if (field.kind === "select") {
    return (
      <FormField label={field.label} required={field.required} invalid={invalid} error="Wajib diisi." hint={field.hint}>
        <Select value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid}>
          <option value="">— Pilih —</option>
          {(field.options ?? []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      </FormField>
    );
  }
  if (field.kind === "checkbox") {
    // Should not happen for FieldCell — checkbox handled separately, but fallback
    return (
      <FormField label={field.label} required={field.required} invalid={invalid} error="Wajib centang." hint={field.hint}>
        <Checkbox checked={value === "true"} onChange={(e) => onChange(String(e.target.checked))} />
      </FormField>
    );
  }
  return (
    <FormField label={field.label} required={field.required} invalid={invalid} error="Wajib diisi." hint={field.hint}>
      {field.kind === "number" ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" invalid={invalid} />
      ) : field.kind === "date" ? (
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} invalid={invalid} />
      )}
    </FormField>
  );
}

const PLACEHOLDER: Partial<Record<string, string>> = {
  alamat: "cth. Jl. Trajeng gg. II no. 8",
  hpKK: "cth. 0812-xxxx",
  posyandu: "cth. Melati 1",
  puskesmas: "cth. Puskesmas Trajeng",
};

const SASARAN_LABEL_SHORT: Partial<Record<SasaranKey, string>> = {
  "bersalin-nifas": "Bersalin & Nifas",
  balita: "Balita 6–71 bulan",
  remaja: "Remaja 6–18 tahun",
  dewasa: "Dewasa",
  lansia: "Lansia",
};

