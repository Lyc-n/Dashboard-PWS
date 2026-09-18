import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/organisms/AppShell";
import { DetailHeader } from "@/components/organisms/DetailHeader";
import { SuccessPanel } from "@/components/organisms/SuccessPanel";
import { SectionCard } from "@/components/molecules/SectionCard";
import { Stepper } from "@/components/molecules/Stepper";
import type { Step } from "@/components/molecules/Stepper";
import { FillBar } from "@/components/molecules/FillBar";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { requireAuth } from "@/lib/auth";
import { useChecklistForm } from "@/features/checklist/hooks/useChecklistForm";
import type { KunjunganRecord } from "@/features/checklist/types";
import { KeluargaInfoSection } from "@/features/checklist/components/KeluargaInfoSection";
import { AnggotaSection } from "@/features/checklist/components/AnggotaSection";
import { SanitasiSection } from "@/features/checklist/components/SanitasiSection";
import { SasaranListSection } from "@/features/checklist/components/SasaranListSection";
import { MasalahSection } from "@/features/checklist/components/MasalahSection";
import { HasilSection } from "@/features/checklist/components/HasilSection";
import { SaveBar } from "@/features/checklist/components/SaveBar";
import { HistorySection } from "@/features/checklist/components/HistorySection";

export const Route = createFileRoute("/checklist")({
  beforeLoad: requireAuth,
  component: Checklist,
});

function Checklist() {
  const { templates, state, dispatch, records, fillPercent, bahaCount, stepState, handleSubmit, reset } =
    useChecklistForm();
  const [saved, setSaved] = useState<KunjunganRecord | null>(null);

  const steps: Step[] = [
    { label: "Data Keluarga & Sasaran", state: stepState[0] },
    { label: "Form Sasaran", state: stepState[1] },
    { label: "Hasil & Tindak", state: stepState[2] },
  ];

  const onSubmit = () => {
    const rec = handleSubmit();
    if (rec) setSaved(rec);
  };

  const handleNext = () => {
    reset();
    setSaved(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppShell>
      <PageHeader title="Input Checklist" description="Checklist Kunjungan Rumah (KR) — form fleksibel diatur Admin di Kelola. Disimpan di perangkat ini." />
      <DetailHeader title="Checklist Kunjungan Rumah — GERMAS 2024" meta="Isi data keluarga & anggota, pilih 1 sasaran tiap anggota yang dinilai, lalu lengkapi penilaian. Periksa ulang sebelum menyimpan." />
      <Stepper steps={steps} />
      <FillBar pct={fillPercent} />

      <SectionCard title="1. Data Keluarga & Anggota" sub="Informasi tempat, KK, anggota keluarga, pilih sasaran tiap anggota, dan sanitasi/lingkungan rumah.">
        <KeluargaInfoSection state={state} templates={templates} dispatch={dispatch} />
        <AnggotaSection state={state} templates={templates} dispatch={dispatch} />
        <SanitasiSection state={state} templates={templates} dispatch={dispatch} />
      </SectionCard>

      <SectionCard title="2. Form Sasaran" sub="Isi identitas, hasil pemeriksaan, kondisi teramati, dan tanda bahaya sesuai Definisi Operasional." actions={<span className="text-xs text-muted">{state.penilaian.length} penilaian · {bahaCount} tanda bahaya dicentang</span>}>
        <SasaranListSection state={state} templates={templates} dispatch={dispatch} bahaCount={bahaCount} />
      </SectionCard>

      <SectionCard title="3. Hasil, Prioritas & Tindak Lanjut" sub="Label prioritas program, masalah ditemukan, hasil kunjungan, dan tanda tangan kader.">
        <MasalahSection state={state} templates={templates} dispatch={dispatch} />
        <HasilSection state={state} templates={templates} dispatch={dispatch} />
      </SectionCard>

      <SectionCard title="Simpan" actions={<SaveBar onReset={reset} onFillDemo={() => dispatch({ type: "FILL_DEMO" })} onSubmit={onSubmit} />}>
        <span className="text-xs text-muted">Pastikan seluruh isian wajib bercentang hijau sebelum menyimpan.</span>
      </SectionCard>

      {saved ? (
        <SuccessPanel title={`Kunjungan ${saved.info.namaKK || "keluarga"} tersimpan.`} message={`${saved.penilaian.length} penilaian sasaran · ${saved.masalah.length} masalah tercatat. Kader dapat melanjutkan ke keluarga berikutnya.`}>
          <Button variant="primary" onClick={handleNext}>Isi keluarga berikutnya</Button>
          <Link to="/sasaran" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-4.5 py-2.75 text-[13px] font-bold text-white hover:bg-accent-hover">Lihat Data Sasaran</Link>
        </SuccessPanel>
      ) : null}

      <SectionCard title="Riwayat Kunjungan" sub="Data tersimpan di perangkat ini.">
        <HistorySection records={records} templates={templates} />
      </SectionCard>
    </AppShell>
  );
}
