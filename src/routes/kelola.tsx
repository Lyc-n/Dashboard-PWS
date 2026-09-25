import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { seedAdminItems, seedAdminPrios, seedAdminStaff } from "@/lib/seeds";
import type { AdminItem, Priority, Staff } from "@/lib/seeds";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { useKrTemplates } from "@/hooks/use-kr-templates";
import { AppShell } from "@/components/organisms/AppShell";
import { StatCard } from "@/components/molecules/StatCard";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Tab } from "@/components/atoms/Tab";
import { requireAuth, isAdminUser, getAuth } from "@/lib/auth.server";
import { TABS } from "@/features/kelola/types";
import type { KelolaTab } from "@/features/kelola/types";
import { FormKrSection } from "@/features/kelola/components/FormKrSection";
import { PrioritasSection } from "@/features/kelola/components/PrioritasSection";
import { StaffSection } from "@/features/kelola/components/StaffSection";

export const Route = createFileRoute("/kelola")({
  beforeLoad: () => {
    const guard = requireAuth();
    if (guard) return guard;
    const user = getAuth();
    if (!isAdminUser(user)) {
      return { redirect: { to: "/laporan" } };
    }
    return undefined;
  },
  component: Kelola,
});

function Kelola() {
  const [items, setItems] = useLocalStorage<AdminItem[]>(STORAGE_KEYS.adminItems, seedAdminItems());
  const [prios, setPrios] = useLocalStorage<Priority[]>(STORAGE_KEYS.adminPrios, seedAdminPrios());
  const [staff, setStaff] = useLocalStorage<Staff[]>(STORAGE_KEYS.adminStaff, seedAdminStaff());
  const { templates, setTemplates, resetTemplates, exportJson, importJson } = useKrTemplates();

  const [tab, setTab] = useState<KelolaTab>("formkr");

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
        description="Admin mengatur template checklist KR fleksibel, prioritas, dan akun staff. Perubahan langsung sinkron ke form kader."
      />

      <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <StatCard caption="Field KR aktif" value={activeFieldCount} />
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
        <FormKrSection
          templates={templates}
          setTemplates={setTemplates}
          resetTemplates={resetTemplates}
          exportJson={exportJson}
          importJson={importJson}
        />
      ) : null}

      {tab === "prioritas" ? (
        <PrioritasSection prios={prios} setPrios={setPrios} items={items} setItems={setItems} />
      ) : null}

      {tab === "staff" ? (
        <StaffSection staff={staff} setStaff={setStaff} />
      ) : null}
    </AppShell>
  );
}
