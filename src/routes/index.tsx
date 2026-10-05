import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboardData } from "@/lib/utils.functions";
import { fmtDate } from "@/lib/utils";
import { PAGE_SIZE } from "@/lib/constants";
import { requireAuth } from "@/lib/auth";
import { AppShell, DataTable, KelurahanSection } from "@/components/organisms";
import type { SummaryCardData } from "@/components/organisms";
import { PageHeader, SectionCard, StatCard, Toolbar } from "@/components/molecules";
import { Select, StatusBadge } from "@/components/atoms";
import { paginate } from "@/features/laporan/components/report-shared";
import { useKegiatanTrend } from "@/features/dashboard/useKegiatanTrend";
import { KegiatanTrendChart } from "@/features/dashboard/KegiatanTrendChart";

export const Route = createFileRoute("/")({
  beforeLoad: requireAuth,
  loader: async () => await getDashboardData(),
  pendingComponent: () => <p className="p-4 text-sm text-muted">Memuat dashboard…</p>,
  component: Dashboard,
})

function Dashboard() {
  const data = Route.useLoaderData();
  const { data: trendData, loading: trendLoading } = useKegiatanTrend();

  const [statusF, setStatusF] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>("tgl");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const items: SummaryCardData[] = useMemo(
    () =>
      data.kelurahan.map((k) => ({
        name: k.name,
        title: `Kelurahan ${k.name}`,
        jiwa: k.total,
        terlayani: k.dikunjungi,
        pct: k.pct,
        sub: k.sub,
      })),
    [data.kelurahan],
  );

  const filtered = useMemo(() => {
    const list = data.recent.filter((r) => statusF === "all" || r.petugas === statusF);
    if (sortKey === "tgl") {
      list.sort((a, b) => a.tanggal.localeCompare(b.tanggal) * (sortDir === "asc" ? 1 : -1));
    }
    return list;
  }, [data.recent, statusF, sortKey, sortDir]);

  const paginated = paginate(filtered, page, PAGE_SIZE);
  const { maxPage, pageClamped, pageRows, info } = paginated;

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
        description="Pantau cakupan kunjungan oleh kader puskesmas, plus isian form terbaru dari semua form."
      />

      <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <StatCard caption="Warga terdata" value={data.totals.warga} sub="data_warga" />
        <StatCard caption="Sudah dikunjungi" value={data.totals.dikunjungi} sub="punya ≥1 isian form" />
        <StatCard
          caption="Total isian form"
          value={data.totals.kunjunganRumah}
          sub="baris surveys yang menunjuk warga"
        />
      </div>

      <KelurahanSection items={items} />

      <SectionCard
        title="Trend Kegiatan Pemberdayaan (12 Bulan Terakhir)"
        sub="Klik titik pada grafik untuk melihat laporan kegiatan bulan tersebut di halaman Laporan."
      >
        <KegiatanTrendChart data={trendData} loading={trendLoading} />
      </SectionCard>

      <SectionCard
        title="Isian Form Terbaru"
        sub="50 isian terakhir dari database, dari semua form. Nama form diambil dari form asalnya."
      >
        {filtered.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted">
            Belum ada isian form di database. Isi lewat halaman Isi Formulir atau jalankan seed.
          </p>
        ) : (
        <DataTable
          className="mt-3.5"
          columns={[
            { key: "tgl", label: "Tanggal", sortable: true },
            { key: "form", label: "Form" },
            { key: "kel", label: "Kelurahan" },
            { key: "nama", label: "Sasaran" },
            { key: "petugas", label: "Petugas" },
            { key: "status", label: "Status" },
            { key: "aksi", label: "Aksi" },
          ]}
          rows={pageRows}
          renderRow={(row) => (
            <tr key={row.id} className="border-b border-surface-2 last:border-none hover:bg-surface-2">
              <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(row.tanggal)}</td>
              <td className="px-3 py-2.5">
                <div className="font-semibold text-ink">{row.formNama}</div>
                <div className="text-muted">Kel. {row.kelurahan}</div>
              </td>
              <td className="px-3 py-2.5">
                <div className="font-semibold text-ink">{row.nama}</div>
                <div className="text-[11px] text-muted">
                  {row.nik ? `NIK ${row.nik}` : "Tanpa warga"}
                </div>
              </td>
              <td className="px-3 py-2.5 text-muted">{row.petugas}</td>
              <td className="px-3 py-2.5">
                <StatusBadge value="Selesai" />
              </td>
              <td className="px-3 py-2.5">
                {row.nik ? (
                  <Link
                    to="/sasaran/$id"
                    params={{ id: row.nik }}
                    className="text-[11px] font-semibold text-accent hover:text-accent-hover"
                  >
                    Lihat
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted">—</span>
                )}
              </td>
            </tr>
          )}
          renderMobileRow={(row) => (
            <div key={row.id} className="border-b border-surface-2 last:border-none px-3.5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{row.nama}</div>
                  <div className="text-[11px] text-muted">Kel. {row.kelurahan}</div>
                </div>
                <StatusBadge value="Selesai" />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted">{fmtDate(row.tanggal)}</span>
                <span className="text-[11px] text-muted">· {row.petugas}</span>
              </div>
              {row.nik ? (
                <Link
                  to="/sasaran/$id"
                  params={{ id: row.nik }}
                  className="mt-2 inline-flex text-[11px] font-semibold text-accent hover:text-accent-hover"
                >
                  Lihat Detail
                </Link>
              ) : null}
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
                aria-label="Filter petugas"
                className="max-w-52.5"
              >
                <option value="all">Semua petugas</option>
                {[...new Set(data.recent.map((r) => r.petugas))].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
              <span className="ml-auto text-xs font-semibold text-muted">
                {filtered.length} isian form
              </span>
            </Toolbar>
          }
          info={info}
          page={pageClamped}
          canPrev={pageClamped > 1}
          canNext={pageClamped < maxPage}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
        />
        )}
      </SectionCard>
    </AppShell>
  )
}