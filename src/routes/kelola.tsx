import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useAdminMaster } from "@/hooks/use-admin-master";
import { useKunjunganRumahTemplates } from "@/hooks/use-kunjungan-rumah-templates";
import { AppShell } from "@/components/organisms";
import { PageHeader, StatCard } from "@/components/molecules";
import { Tab } from "@/components/atoms";
// [perbaikan] guard pindah ke requireAdmin (verifikasi cookie+JWT di server, role dari payload) —
//   expect: tanpa sesi → /pin; sesi non-admin → /laporan; localStorage auth tak dipakai lagi.
import { requireAdmin } from "@/lib/auth";
import { TABS } from "@/features/kelola/types";
import type { KelolaTab } from "@/features/kelola/types";
import { FormKunjunganRumahSection } from "@/features/kelola/components/FormKunjunganRumahSection";
import { PrioritasSection } from "@/features/kelola/components/PrioritasSection";
import { StaffSection } from "@/features/kelola/components/StaffSection";

export const Route = createFileRoute("/kelola")({
  beforeLoad: requireAdmin,
  component: Kelola,
});

function Kelola() {
  const { items, prios, staff, error: masterError, loading: masterLoading, savePrio, saveStaff } = useAdminMaster();
  const { templates, setTemplates, resetTemplates, exportJson, importJson, readOnly, source, error, loading } = useKunjunganRumahTemplates();

  const [tab, setTab] = useState<KelolaTab>("form-kunjungan-rumah");

  const activeFieldCount =
    templates.keluargaInfo.filter((f) => f.active).length +
    templates.anggota.filter((f) => f.active).length +
    templates.sanitasi.filter((f) => f.active).length +
    templates.masalah.filter((f) => f.active).length +
    Object.values(templates.sasaran).reduce((a, s) => a + s.fields.filter((f) => f.active).length, 0);
  const prioOn = prios.filter((p) => p.on).length;
  const staffOn = staff.filter((s) => s.on).length;

  return (
    <AppShell>
      <PageHeader
        title="Kelola Master Data"
        description="Admin mengatur template kunjungan rumah fleksibel, prioritas, dan akun staff. Perubahan langsung sinkron ke form kader."
      />

      {masterError ? <p className="mt-3 text-sm text-destructive">{masterError}</p> : null}
      {masterLoading ? <p className="mt-3 text-sm text-muted-foreground">Memuat master data…</p> : null}

      <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <StatCard caption="Field Kunjungan Rumah aktif" value={activeFieldCount} />
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

      {tab === "form-kunjungan-rumah" ? (
        <FormKunjunganRumahSection
          templates={templates}
          setTemplates={setTemplates}
          resetTemplates={resetTemplates}
          exportJson={exportJson}
          importJson={importJson}
          readOnly={readOnly}
          source={source}
          error={error}
          loading={loading}
        />
      ) : null}

      {tab === "prioritas" ? (
        <PrioritasSection prios={prios} items={items} savePrio={savePrio} />
      ) : null}

      {tab === "staff" ? (
        <StaffSection staff={staff} saveStaff={saveStaff} />
      ) : null}
    </AppShell>
  );
}
