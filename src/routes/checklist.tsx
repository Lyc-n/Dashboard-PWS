import { useMemo, useReducer, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useKrTemplates } from "@/hooks/use-kr-templates";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { useToast } from "@/providers/toast";
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
import { getKunjunganRepository } from "@/lib/repositories";
import { validateKunjungan } from "@/features/checklist/services/validateKunjungan";
import { initialKunjunganState, kunjunganReducer } from "@/features/checklist/store/kunjunganReducer";
import { selectBahaCount, selectFillPercent, selectStepState } from "@/features/checklist/store/kunjunganSelectors";
import { CHECKLIST_SCHEMA_VERSION, createRecordId, fromStorageWrapper } from "@/features/checklist/types";
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
  const { templates } = useKrTemplates();
  const toast = useToast();
  const [state, dispatch] = useReducer(kunjunganReducer, undefined, initialKunjunganState);
  const [rawRecords, setRawRecords] = useLocalStorage<unknown>(STORAGE_KEYS.checklist, []);
  const records: KunjunganRecord[] = useMemo(() => fromStorageWrapper(rawRecords), [rawRecords]);
  const [saved, setSaved] = useState<KunjunganRecord | null>(null);

  const fillPercent = useMemo(() => selectFillPercent(state, templates), [state, templates]);
  const bahaCount = useMemo(() => selectBahaCount(state), [state.penilaian]);
  const stepState = useMemo(() => selectStepState(state), [state.anggota, state.penilaian, state.ttd]);

  const steps: Step[] = [
    { label: "Data Keluarga & Sasaran", state: stepState[0] },
    { label: "Form Sasaran", state: stepState[1] },
    { label: "Hasil & Tindak", state: stepState[2] },
  ];

  const handleSubmit = () => {
    const { ok, invalid } = validateKunjungan({ ...state, templates });
    dispatch({ type: "SET_INVALID", invalid });
    if (!ok) {
      toast("Periksa kembali isian yang wajib diisi.");
      return;
    }
    const rec: KunjunganRecord = {
      id: createRecordId(),
      schemaVersion: CHECKLIST_SCHEMA_VERSION,
      clientId: createRecordId(),
      syncedAt: null,
      waktuSimpan: new Date().toISOString(),
      info: { ...state.info },
      sanitasi: { ...state.sanitasi },
      anggota: state.anggota.map((m) => ({ ...m })),
      penilaian: state.penilaian.map((p) => ({ ...p, values: { ...p.values }, checks: { ...p.checks }, prioritas: [...p.prioritas] })),
      masalah: state.masalah.map((m) => ({ ...m })),
      hasil: state.hasil,
      jadwal: state.jadwal,
      ttd: state.ttd,
    };
    // repo wrapper keeps versioned shape; also update rawRecords for reactivity
    try {
      getKunjunganRepository().save(rec);
      setRawRecords((prev: unknown) => {
        const prevList = fromStorageWrapper(prev);
        const next = [...prevList, rec];
        // store as wrapper object to be supabase-ready
        return { version: CHECKLIST_SCHEMA_VERSION, updatedAt: new Date().toISOString(), data: next } as unknown as typeof prev; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
      });
    } catch {
      // fallback direct
      setRawRecords((prev: unknown) => {
        const prevList = fromStorageWrapper(prev);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- wrapper type compat
        return [...prevList, rec] as unknown as typeof prev;
      });
    }
    setSaved(rec);
    toast(`Kunjungan ${rec.info.namaKK || "keluarga"} tersimpan.`);
  };

  const handleNext = () => {
    dispatch({ type: "RESET" });
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

      <SectionCard title="Simpan" actions={<SaveBar onReset={() => dispatch({ type: "RESET" })} onFillDemo={() => dispatch({ type: "FILL_DEMO" })} onSubmit={handleSubmit} />}>
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
