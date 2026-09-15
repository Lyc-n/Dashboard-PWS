import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BASE_MONTHLY,
  KELURAHAN_DATA,
  PRIORITAS_DATA,
  POSYANDU_CONTRIB,
  TINDAK_CANDIDATES,
  dashboardRows,
} from "@/lib/mock-data";
import { MONTHS } from "@/lib/constants";
import { average, fmtDate } from "@/lib/utils";
import { AppShell } from "@/components/organisms/AppShell";
import { ChartCard } from "@/components/organisms/ChartCard";
import { DataTable } from "@/components/organisms/DataTable";
import { FilterBar } from "@/components/organisms/FilterBar";
import { KelurahanSection } from "@/components/organisms/KelurahanSection";
import { PrioritasSection } from "@/components/organisms/PrioritasSection";
import { SectionCard } from "@/components/molecules/SectionCard";
import { TindakCard } from "@/components/molecules/TindakCard";
import { Select } from "@/components/atoms/Select";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Tag } from "@/components/atoms/Tag";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Toolbar } from "@/components/molecules/Toolbar";

export const Route = createFileRoute("/")({
  component: Dashboard,
})

const PAGE_SIZE = 10;

function Dashboard() {
  const rows = useMemo(() => dashboardRows(), []);

  const [tab, setTab] = useState<"kelurahan" | "prioritas">("kelurahan");
  const [statusF, setStatusF] = useState("all");
  const [sourceF, setSourceF] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>("tgl");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const avgVal = average(BASE_MONTHLY);

  const filtered = useMemo(() => {
    const list = rows.filter(
      (r) =>
        (statusF === "all" || r.status === statusF) &&
        (sourceF === "all" || r.sumber === sourceF),
    );
    if (sortKey === "tgl") {
      list.sort((a, b) => a.tgl.localeCompare(b.tgl) * (sortDir === "asc" ? 1 : -1));
    }
    return list;
  }, [rows, statusF, sourceF, sortKey, sortDir]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, maxPage);
  const pageRows = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Dashboard PWS"
        description="Pantau cakupan program prioritas (ibu & balita) lewat Kunjungan Rumah oleh kader puskesmas."
      />

      <FilterBar
        tabs={[
          { key: "kelurahan", label: "Kelurahan" },
          { key: "prioritas", label: "Prioritas" },
        ]}
        activeTab={tab}
        onTabChange={(k) => setTab(k as "kelurahan" | "prioritas")}
      >
      </FilterBar>

      {tab === "kelurahan" ? (
        <KelurahanSection items={KELURAHAN_DATA} />
      ) : (
        <PrioritasSection items={PRIORITAS_DATA} />
      )}

      <ChartCard
        title="Tren Kunjungan Lapangan PWS 2026"
        note="per bulan"
        data={BASE_MONTHLY}
        labels={[...MONTHS]}
        renderTooltip={(i) => (
          <div className="grid gap-1">
            <b>
              {MONTHS[i]} · {BASE_MONTHLY[i]} kunjungan
            </b>
            {POSYANDU_CONTRIB[i].map((x) => (
              <div key={x.n} className="flex items-center justify-between gap-4">
                {x.n}
                <b>{x.v}</b>
              </div>
            ))}
          </div>
        )}
      >
        {[
          { label: "Kunjungan rata-rata / bulan", val: avgVal },
          { label: "Rujukan RS / PKM (estimasi)", val: Math.round((avgVal * 18) / 100) },
          { label: "Total Jiwa Dikunjungi", val: 5430 },
        ].map((s) => (
          <div key={s.label} className="rounded-[10px] border border-line bg-surface p-3">
            <div className="text-[18px] font-extrabold text-ink">{s.val}</div>
            <div className="mt-0.5 text-[11px] text-muted">{s.label}</div>
          </div>
        ))}
      </ChartCard>

      <SectionCard
        title="Perlu Tindak Lanjut — Disarankan"
        sub="Punya masalah tertinggal atau berisiko. Butuh tindakan oleh kader / Puskesmas."
      >
        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {TINDAK_CANDIDATES.map((t) => (
            <TindakCard key={t.kel} icon={t.icon} color={t.color} title={t.kel} issue={t.issue} />
          ))}
        </div>
      </SectionCard>

      <DataTable
        className="mt-3.5"
        columns={[
          { key: "tgl", label: "Tanggal", sortable: true },
          { key: "kel", label: "Kelurahan" },
          { key: "nama", label: "Sasaran & prioritas" },
          { key: "sumber", label: "Sumber" },
          { key: "status", label: "Status" },
          { key: "aksi", label: "Aksi" },
        ]}
        rows={pageRows}
        renderRow={(row, i) => (
          <tr key={i} className="border-b border-surface-2 last:border-none hover:bg-surface-2">
            <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(row.tgl)}</td>
            <td className="px-3 py-2.5">
              <div className="font-semibold text-ink">{row.kel}</div>
              <div className="text-[11px] text-muted">{row.posy}</div>
            </td>
            <td className="px-3 py-2.5">
              <Tag priority={row.prior} />
              <div className="mt-1 font-semibold text-ink">{row.nama}</div>
              <div className="text-[11px] text-muted">{row.hasil}</div>
            </td>
            <td className="px-3 py-2.5 text-muted">{row.sumber}</td>
            <td className="px-3 py-2.5">
              <StatusBadge value={row.status} />
            </td>
            <td className="px-3 py-2.5">
              <Link to="/sasaran" className="text-[11px] font-semibold text-accent hover:text-accent-hover">
                Lihat
              </Link>
            </td>
          </tr>
        )}
        renderMobileRow={(row, i) => (
          <div key={i} className="border-b border-surface-2 last:border-none px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-ink">{row.nama}</div>
                <div className="text-[11px] text-muted">Kel. {row.kel} · {row.posy}</div>
              </div>
              <StatusBadge value={row.status} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Tag priority={row.prior} />
              <span className="text-[11px] text-muted">{fmtDate(row.tgl)}</span>
              <span className="text-[11px] text-muted">· {row.sumber}</span>
            </div>
            <div className="mt-1.5 text-[11px] text-muted">{row.hasil}</div>
            <Link to="/sasaran" className="mt-2 inline-flex text-[11px] font-semibold text-accent hover:text-accent-hover">
              Lihat Detail
            </Link>
          </div>
        )}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        toolbar={
          <Toolbar>
            <Select
              value={statusF}
              onChange={(e) => {
                setStatusF(e.target.value);
                setPage(1);
              }}
              aria-label="Filter status"
              className="max-w-47.5"
            >
              <option value="all">Semua status</option>
              <option>Selesai</option>
              <option>Terjadwal</option>
              <option>Perlu tindak lanjut</option>
            </Select>
            <Select
              value={sourceF}
              onChange={(e) => {
                setSourceF(e.target.value);
                setPage(1);
              }}
              aria-label="Filter sumber"
              className="max-w-52.5"
            >
              <option value="all">Semua sumber</option>
              <option>Kunjungan rumah</option>
              <option>Datang ke posyandu</option>
            </Select>
            <span className="ml-auto text-xs font-semibold text-muted">{filtered.length} kunjungan</span>
          </Toolbar>
        }
        info={`Hal ${pageClamped} · ${(pageClamped - 1) * PAGE_SIZE + 1}–${Math.min(pageClamped * PAGE_SIZE, filtered.length)} dari ${filtered.length}`}
        page={pageClamped}
        canPrev={pageClamped > 1}
        canNext={pageClamped < maxPage}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
      />
    </AppShell>
  )
}