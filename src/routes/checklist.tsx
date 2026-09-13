import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useKunjungan } from "@/lib/use-kunjungan";
import { useLocalStorage } from "@/lib/use-local-storage";
import { HASIL_KUNJUNGAN, PRIOS, STORAGE_KEYS } from "@/lib/constants";
import type { FormField as FieldDef, SasaranKey } from "@/lib/kr-form";
import {
  HUB_KK,
  JENIS_AIR,
  PENDIDIKAN,
  PEKERJAAN,
  SASARAN_DEFS,
  STATUS_KAWIN,
  sasaranDef,
} from "@/lib/kr-form";
import { fmtDate } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { AppShell } from "@/components/organisms/AppShell";
import { DetailHeader } from "@/components/organisms/DetailHeader";
import { HistoryPanel } from "@/components/organisms/HistoryPanel";
import { SuccessPanel } from "@/components/organisms/SuccessPanel";
import { SectionCard } from "@/components/molecules/SectionCard";
import { Stepper } from "@/components/molecules/Stepper";
import type { Step } from "@/components/molecules/Stepper";
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

type KunjunganRecord = NonNullable<ReturnType<ReturnType<typeof useKunjungan>["submit"]>>;
type SanitasiCheckKey = "jkn" | "airBersih" | "jamban" | "jambanSaniter" | "ventilasi" | "odgj" | "tbc" | "hipertensi" | "dm";

export const Route = createFileRoute("/checklist")({
  component: Checklist,
})

function Checklist() {
  const k = useKunjungan();
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

  return (
    <AppShell>
      <PageHeader
        title="Input Checklist"
        description="Checklist Kunjungan Rumah (KR) sesuai form siklus hidup Kemenkes — data keluarga, anggota, sasaran, tanda bahaya, tindak lanjut. Disimpan di perangkat ini."
      />

      <DetailHeader
        title="Checklist Kunjungan Rumah — GERMAS 2024"
        meta="Data keluarga & anggota dulu, lalu pilih sasaran untuk penilaian. Periksa ulang sebelum menyimpan."
      />

      <Stepper steps={steps} />
      <FillBar pct={k.fillPercent} />

      <SectionCard title="1. Data Keluarga & Anggota" sub="Informasi tempat, KK, anggota keluarga, dan sanitasi/lingkungan rumah.">
        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {INFO_FIELDS.map((f) => (
            <FormField
              key={f.key}
              label={f.label}
              required={f.key === "tglPengumpulan" || f.key === "posyandu"}
              invalid={f.key === "tglPengumpulan" ? !!k.invalid.tgl : f.key === "posyandu" ? !!k.invalid.posyandu : false}
              error={f.key === "posyandu" || f.key === "tglPengumpulan" ? "Wajib diisi." : undefined}
            >
              {f.kind === "date" ? (
                <Input type="date" value={k.info[f.key]} onChange={(e) => k.setField(f.key, e.target.value)} />
              ) : (
                <Input
                  value={k.info[f.key]}
                  onChange={(e) => k.setField(f.key, e.target.value)}
                  placeholder={PLACEHOLDER[f.key] ?? ""}
                />
              )}
            </FormField>
          ))}
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
                  <FormField label="Nama lengkap" required invalid={!!k.invalid[`nama:${m.id}`]} error="Wajib diisi.">
                    <Input value={m.nama} onChange={(e) => k.updateAnggota(m.id, "nama", e.target.value)} placeholder="cth. Budi Setiawan" invalid={!!k.invalid[`nama:${m.id}`]} />
                  </FormField>
                  <FormField label="NIK" required hint="16 digit, tanpa spasi." invalid={!!k.invalid[`nik:${m.id}`]} error="Wajib 16 digit & unik.">
                    <Input value={m.nik} onChange={(e) => k.updateAnggota(m.id, "nik", e.target.value.replace(/\D/g, "").slice(0, 16))} inputMode="numeric" placeholder="3579…………" invalid={!!k.invalid[`nik:${m.id}`]} />
                  </FormField>
                  <FormField label="Tanggal lahir" required invalid={!!k.invalid[`tglLahir:${m.id}`]} error="Wajib diisi.">
                    <Input type="date" value={m.tglLahir} onChange={(e) => k.updateAnggota(m.id, "tglLahir", e.target.value)} invalid={!!k.invalid[`tglLahir:${m.id}`]} />
                  </FormField>
                  <FormField label="Jenis kelamin">
                    <Select value={m.jk} onChange={(e) => k.updateAnggota(m.id, "jk", e.target.value)}>
                      <option>L</option>
                      <option>P</option>
                    </Select>
                  </FormField>
                  <FormField label="Hubungan dengan KK">
                    <Select value={m.hubKK} onChange={(e) => k.updateAnggota(m.id, "hubKK", e.target.value)}>
                      <option value="">— Pilih —</option>
                      {HUB_KK.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Status perkawinan">
                    <Select value={m.statusKawin} onChange={(e) => k.updateAnggota(m.id, "statusKawin", e.target.value)}>
                      <option value="">— Pilih —</option>
                      {STATUS_KAWIN.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Pendidikan terakhir">
                    <Select value={m.pendidikan} onChange={(e) => k.updateAnggota(m.id, "pendidikan", e.target.value)}>
                      <option value="">— Pilih —</option>
                      {PENDIDIKAN.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Pekerjaan">
                    <Select value={m.pekerjaan} onChange={(e) => k.updateAnggota(m.id, "pekerjaan", e.target.value)}>
                      <option value="">— Pilih —</option>
                      {PEKERJAAN.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-1.5">
          <span className="text-xs font-semibold text-ink">Sanitasi / lingkungan keluarga</span>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 max-md:grid-cols-2 max-sm:grid-cols-1">
            {SANITASI_CHECKBOXES.map((s) => (
              <label key={s.key} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox checked={k.sanitasi[s.key]} onChange={(e) => k.setSanField(s.key, e.target.checked)} />
                {s.label}
              </label>
            ))}
            <label className="flex items-center gap-2 text-[13px]">
              <span className="text-muted">Jenis air bersih</span>
              <Select value={k.sanitasi.jenisAir} onChange={(e) => k.setSanField("jenisAir", e.target.value)} className="max-w-44 py-1 text-xs">
                <option value="">— Pilih —</option>
                {JENIS_AIR.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </label>
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
                    options={SASARAN_DEFS.map((d) => ({ value: d.key, label: SASARAN_LABEL_SHORT[d.key] ?? d.label }))}
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
        {k.invalid.penilaian ? (
          <span className="mt-2 block text-[11px] font-semibold text-danger">Pilih minimal 1 sasaran untuk diperiksa.</span>
        ) : null}
      </SectionCard>

      <SectionCard
        title="3. Form Sasaran"
        sub="Isi identitas, hasil pemeriksaan, kondisi teramati, dan tanda bahaya sesuai Definisi Operasional."
        actions={<span className="text-xs text-muted">{k.penilaian.length} penilaian · {k.bahaCount} tanda bahaya dicentang</span>}
      >
        {k.penilaian.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-line p-4 text-center text-[13px] text-muted">
            Belum ada sasaran dipilih di step 2.
          </div>
        ) : (
          <div className="grid gap-4">
            {k.penilaian.map((p) => (
              <SasaranForm key={p.id} p={p} k={k} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="4. Hasil, Prioritas & Tindak Lanjut" sub="Label prioritas program, masalah ditemukan, hasil kunjungan, dan tanda tangan kader.">
        {k.penilaian.length > 0 ? (
          <div className="grid gap-3">
            {k.penilaian.map((p) => {
              const anggota = k.anggota.find((a) => a.id === p.anggotaId);
              return (
                <div key={p.id} className="rounded-[10px] border border-line bg-surface p-3">
                  <div className="mb-2 text-xs font-semibold text-ink">
                    {sasaranDef(p.sasaran).label} · {anggota?.nama || "—"}
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
                  <FormField label="Nama">
                    <Input value={m.nama} onChange={(e) => k.updateMasalah(m.id, "nama", e.target.value)} />
                  </FormField>
                  <FormField label="NIK">
                    <Input value={m.nik} onChange={(e) => k.updateMasalah(m.id, "nik", e.target.value)} />
                  </FormField>
                  <FormField label="Tanggal lahir">
                    <Input type="date" value={m.tglLahir} onChange={(e) => k.updateMasalah(m.id, "tglLahir", e.target.value)} />
                  </FormField>
                  <FormField label="Alamat">
                    <Input value={m.alamat} onChange={(e) => k.updateMasalah(m.id, "alamat", e.target.value)} />
                  </FormField>
                  <FormField label="No. telepon">
                    <Input value={m.telepon} onChange={(e) => k.updateMasalah(m.id, "telepon", e.target.value)} />
                  </FormField>
                  <FormField label="Masalah kesehatan ditemukan" className="col-span-2">
                    <Input value={m.masalah} onChange={(e) => k.updateMasalah(m.id, "masalah", e.target.value)} placeholder="cth. Hipertensi tidak patuh berobat" />
                  </FormField>
                  <FormField label="Tindak lanjut" className="col-span-2">
                    <Input value={m.tindakLanjut} onChange={(e) => k.updateMasalah(m.id, "tindakLanjut", e.target.value)} placeholder="cth. Edukasi & jadwal kontrol" />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {HASIL_KUNJUNGAN.map((h) => (
            <RadioCard
              key={h}
              title={h}
              description={h === "Kontrol ulang" ? "Butuh jadwal ulang" : h === "Rujuk ke Puskesmas" ? "Butuh rujukan" : "Tidak ada masalah berarti"}
              inputProps={{ name: "hasil", checked: k.hasil === h, onChange: () => k.setHasil(h) }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">
          <FormField
            label={k.hasil === "Kontrol ulang" ? "Jadwal ulang" : "Jadwal kontrol berikutnya"}
            required={k.hasil === HASIL_KUNJUNGAN[1]}
            invalid={!!k.invalid.jadwal}
            error="Wajib isi jadwal."
          >
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
        <SuccessPanel
          title={`Kunjungan ${saved.info.namaKK || "keluarga"} tersimpan.`}
          message={`${saved.penilaian.length} penilaian sasaran · ${saved.masalah.length} masalah tercatat. Kader dapat melanjutkan ke keluarga berikutnya.`}
        >
          <Button variant="primary" onClick={handleNext}>
            Isi keluarga berikutnya
          </Button>
          <Link
            to="/sasaran"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-4.5 py-2.75 text-[13px] font-bold text-white hover:bg-accent-hover"
          >
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
                  <Tag key={p.id}>{sasaranDef(p.sasaran).label}</Tag>
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
  )
}

function SasaranForm({ p, k }: { p: ReturnType<typeof useKunjungan>["penilaian"][number]; k: ReturnType<typeof useKunjungan> }) {
  const def = sasaranDef(p.sasaran);
  const anggota = k.anggota.find((a) => a.id === p.anggotaId);
  return (
    <div className="rounded-[10px] border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <b className="text-[13px]">{def.label}</b>
          <span className="text-[11px] text-muted">Anggota: {anggota?.nama || "—"}</span>
        </div>
        <button type="button" onClick={() => k.removePenilaian(p.id)} className="text-muted hover:text-danger" aria-label="Hapus penilaian">
          <X size={16} />
        </button>
      </div>

      {def.identitas.length > 0 ? (
        <div className="grid gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Identitas</span>
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {def.identitas.map((f) => (
              <FieldCell key={f.key} field={f} value={p.values[f.key] ?? ""} onChange={(v) => k.setValue(p.id, f.key, v)} />
            ))}
          </div>
        </div>
      ) : null}

      {def.kolom.length > 0 ? (
        <div className="mt-3 grid gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kolom pemantauan</span>
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {def.kolom.map((f) => (
              <FieldCell key={f.key} field={f} value={p.values[f.key] ?? ""} onChange={(v) => k.setValue(p.id, f.key, v)} />
            ))}
          </div>
        </div>
      ) : null}

      {def.bools.length > 0 ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kondisi / pelayanan</span>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 max-md:grid-cols-2 max-sm:grid-cols-1">
            {def.bools.map((b) => (
              <label key={b.key} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox checked={p.checks[b.key] ?? false} onChange={(e) => k.setCheck(p.id, b.key, e.target.checked)} />
                {b.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {def.baha.length > 0 ? (
        <div className="mt-3 grid gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">BaHa — tanda bahaya</span>
            <span className="text-[11px] text-muted">
              {def.baha.filter((b) => p.checks[b.key]).length}/{def.baha.length} ada
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-sm:grid-cols-1">
            {def.baha.map((b) => (
              <label key={b.key} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox
                  checked={p.checks[b.key] ?? false}
                  onChange={(e) => k.setCheck(p.id, b.key, e.target.checked)}
                  className={p.checks[b.key] ? "!border-[var(--color-danger-border)]" : ""}
                />
                {b.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldCell({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  if (field.kind === "select") {
    return (
      <FormField label={field.label}>
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Pilih —</option>
          {(field.options ?? []).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      </FormField>
    );
  }
  return (
    <FormField label={field.label}>
      {field.kind === "number" ? (
        <Input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" />
      ) : field.kind === "date" ? (
        <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </FormField>
  );
}

const INFO_FIELDS = [
  { key: "tglPengumpulan", label: "Tanggal pengumpulan data", kind: "date" },
  { key: "posyandu", label: "Posyandu", kind: "text" },
  { key: "kelurahan", label: "Desa/Kelurahan", kind: "text" },
  { key: "kecamatan", label: "Kecamatan", kind: "text" },
  { key: "puskesmas", label: "Puskesmas", kind: "text" },
  { key: "pustu", label: "Pustu / posyandu prima", kind: "text" },
  { key: "namaKK", label: "Nama kepala keluarga", kind: "text" },
  { key: "alamat", label: "Alamat", kind: "text" },
  { key: "hpKK", label: "No. HP KK/anggota", kind: "text" },
  { key: "kabKota", label: "Kabupaten/Kota", kind: "text" },
  { key: "provinsi", label: "Provinsi", kind: "text" },
] as const;

const PLACEHOLDER: Partial<Record<string, string>> = {
  alamat: "cth. Jl. Trajeng gg. II no. 8",
  hpKK: "cth. 0812-xxxx",
  posyandu: "cth. Melati 1",
  puskesmas: "cth. Puskesmas Trajeng",
};

const SASARAN_LABEL_SHORT: Partial<Record<SasaranKey, string>> = {
  "bersalin-nifas": "Bersalin & Nifas",
  balita: "Balita 6–71",
  remaja: "Remaja 6–18",
  dewasa: "Dewasa",
  lansia: "Lansia",
};

const SANITASI_CHECKBOXES: { key: SanitasiCheckKey; label: string }[] = [
  { key: "jkn", label: "Jaminan kesehatan (JKN/JamKesDa)" },
  { key: "airBersih", label: "Sarana air bersih" },
  { key: "jamban", label: "Jamban keluarga" },
  { key: "jambanSaniter", label: "Jamban saniter" },
  { key: "ventilasi", label: "Ventilasi cukup" },
  { key: "odgj", label: "Anggota dgn gangguan jiwa (ODGJ)" },
  { key: "tbc", label: "Anggota terdiagnosa TBC" },
  { key: "hipertensi", label: "Anggota terdiagnosa hipertensi" },
  { key: "dm", label: "Anggota terdiagnosa DM" },
];

export default Checklist;