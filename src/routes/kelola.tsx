import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useUserRegistry } from "@/hooks/use-user-registry";
import { useKunjunganRumahTemplates } from "@/hooks/use-kunjungan-rumah-templates";
import { AppShell } from "@/components/organisms";
import { PageHeader, StatCard } from "@/components/molecules";
import { Tab } from "@/components/atoms";
// [perbaikan] guard pindah ke requireAdmin (verifikasi cookie+JWT di server, role dari payload) —
//   expect: tanpa sesi → /pin; sesi non-admin → /laporan; localStorage auth tak dipakai lagi.
import { requireAdmin } from "@/lib/auth";
import { TABS } from "@/features/kelola/types";
import type { KelolaTab } from "@/features/kelola/types";
import { FormBuilderSection } from "@/features/kelola/components/FormBuilderSection";
import { UserSection } from "@/features/kelola/components/UserSection";

export const Route = createFileRoute("/kelola")({
  beforeLoad: requireAdmin,
  component: Kelola,
});

function Kelola() {
  const { pengguna, fasilitas, error: registryError, loading: registryLoading, save, setAktif } = useUserRegistry();
  // Hook ini hanya dipakai untuk angka ringkasan di bawah. Definisi formnya
  // sendiri disunting di tab Form Builder — termasuk form kunjungan rumah,
  // yang tidak lagi punya tab sendiri.
  const { templates, error: templateError, loading: templateLoading } = useKunjunganRumahTemplates();

  const [tab, setTab] = useState<KelolaTab>("form-builder");

  const activeFieldCount =
    templates.keluargaInfo.filter((f) => f.active).length +
    templates.anggota.filter((f) => f.active).length +
    templates.sanitasi.filter((f) => f.active).length +
    templates.masalah.filter((f) => f.active).length +
    Object.values(templates.sasaran).reduce((a, s) => a + s.fields.filter((f) => f.active).length, 0);
  const petugasAktif = pengguna.filter((p) => p.aktif && p.role !== "admin").length;

  return (
    <AppShell>
      <PageHeader
        title="Kelola Master Data"
        description="Admin menyusun form, dan akun staff/kader. Perubahan langsung sinkron ke form kader."
      />

      {registryError ? <p className="mt-3 text-sm text-destructive">{registryError}</p> : null}
      {registryLoading ? <p className="mt-3 text-sm text-muted-foreground">Memuat daftar akun…</p> : null}
      {templateError ? <p className="mt-3 text-sm text-destructive">{templateError}</p> : null}
      {templateLoading ? <p className="mt-3 text-sm text-muted-foreground">Menghitung field aktif…</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <StatCard caption="Field Kunjungan Rumah aktif" value={activeFieldCount} />
        <StatCard caption="Petugas aktif" value={petugasAktif} />
      </div>

      <div role="tablist" aria-label="Kelola" className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Tab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)} role="tab" aria-selected={tab === t.key}>
            {t.label}
          </Tab>
        ))}
      </div>

      {tab === "form-builder" ? <FormBuilderSection /> : null}

      {tab === "staff" ? (
        <UserSection pengguna={pengguna} fasilitas={fasilitas} save={save} setAktif={setAktif} />
      ) : null}
    </AppShell>
  );
}
