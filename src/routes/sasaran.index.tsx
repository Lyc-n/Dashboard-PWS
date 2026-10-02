import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAsyncData } from "@/hooks/use-async-data";
import { getSasaranList } from "@/lib/utils.functions";
import type { SasaranListRow } from "@/lib/utils.functions";
import { requireAuth } from "@/lib/auth";
import { KELS, PAGE_SIZE } from "@/lib/constants";
import { downloadCsv, fmtDate } from "@/lib/utils";
import { DataTable, FilterCard } from "@/components/organisms";
import { PageHeader, SectionCard, Toolbar } from "@/components/molecules";
import { Button, Input, Select, StatusBadge } from "@/components/atoms";

const DEBOUNCE_MS = 500;

function opsiSearch(search: Record<string, unknown>): {
  q?: string;
  status?: string;
  kel?: string;
  page?: number;
} {
  const q = typeof search.q === "string" ? search.q : undefined;
  const status = typeof search.status === "string" ? search.status : undefined;
  const kel = typeof search.kel === "string" ? search.kel : undefined;
  const page = typeof search.page === "number" && search.page > 0 ? search.page : undefined;
  return { q, status, kel, page };
}

export const Route = createFileRoute("/sasaran/")({
  beforeLoad: requireAuth,
  validateSearch: (search: Record<string, unknown>) => opsiSearch(search),
  component: Sasaran,
})

function Sasaran() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  // Filter di URL: `q` (dan page) dibawa sebagai search param supaya halaman
  // hasil filter bisa dibagikan/di-refresh. Ganti filter apa pun otomatis
  // kembali ke halaman 1.
  const q = search.q ?? "";
  const status = search.status ?? "all";
  const kel = search.kel ?? "all";
  const pageIn = search.page ?? 1;

  // Debounce pencarian: ketik cepat tidak mengirim request per karakter.
  // Nilai input ditunda 500ms di local state, baru disinkronkan ke URL.
  const [queryDraft, setQueryDraft] = useState(q);
  useEffect(() => setQueryDraft(q), [q]);
  useEffect(() => {
    if (queryDraft === q) return;
    const timer = setTimeout(() => setFilter({ q: queryDraft }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [queryDraft, q, search.status, search.kel, pageIn]);

  const setFilter = (patch: Partial<{ q: string; status: string; kel: string; page: number }>) => {
    const ubahFilter = patch.q !== undefined || patch.status !== undefined || patch.kel !== undefined;
    navigate({
      search: { ...{ q, status, kel }, ...patch, page: ubahFilter ? 1 : (patch.page ?? pageIn) },
    });
  };

  const reset = () => {
    setQueryDraft("");
    setFilter({ q: "", status: "all", kel: "all", page: 1 });
  };

  // Fetch hanya di sini → ganti filter me-reload tabel, header + filter card
  // tetap di tempat tanpa hilang. URL search param tetap kebenaran tunggal.
  const { data, loading, error } = useAsyncData(
    () => getSasaranList({ data: { q, status, kel, page: pageIn } }),
    [q, status, kel, pageIn],
    { rows: [] as SasaranListRow[], total: 0 },
    {
      mapError: () => "Gagal memuat data. Coba lagi.",
      onSuccess: (res) => {
        const pageTerakhir = Math.max(1, Math.ceil(res.total / PAGE_SIZE));
        if (pageIn > pageTerakhir) {
          setFilter({ page: pageTerakhir });
        }
      },
    },
  );
  const rows = data.rows;
  const total = data.total;

  const doneCount = rows.filter((r) => r.status === "Sudah").length;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageIn, maxPage);

  const exportAllCsv = async () => {
    const all = await getSasaranList({
      data: { q, status, kel, all: true },
    });
    const head = ["No", "Tanggal Terakhir", "Nama", "NIK", "Kelurahan", "Kunjungan Rumah", "Status"];
    const csvRows = all.rows.map((r, i) => [i + 1, r.tgl ?? "—", r.nama, r.nik, r.kelurahan, r.kunjunganRumah, r.status]);
    downloadCsv("data-sasaran.csv", head, csvRows);
  };

  return (
    <>
      <PageHeader
        title="Data Sasaran"
        description="Daftar warga dari database beserta status kunjungan rumahnya."
      />

      <FilterCard title="Saring Data" sub="Temukan sasaran tertentu dengan cepat.">
        <Toolbar>
          <Input
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            placeholder="Cari nama atau NIK…"
            aria-label="Cari sasaran"
            className="max-w-60 max-md:max-w-none"
          />
          <Select
            value={status}
            onChange={(e) => setFilter({ status: e.target.value })}
            aria-label="Filter status"
            className="max-w-45 max-md:max-w-none"
          >
            <option value="all">Semua status</option>
            <option>Sudah</option>
            <option>Belum</option>
          </Select>
          <Select
            value={kel}
            onChange={(e) => setFilter({ kel: e.target.value })}
            aria-label="Filter kelurahan"
            className="max-w-45 max-md:max-w-none"
          >
            <option value="all">Semua kelurahan</option>
            {KELS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
        </Toolbar>
      </FilterCard>

      <SectionCard
        title="Data Sasaran"
        actions={
          <Toolbar className="ml-auto">
            <span className="text-xs text-muted">
              {total} sasaran · {doneCount} Sudah pada halaman ini
            </span>
            <Button size="sm" onClick={reset}>
              Reset
            </Button>
            <Button size="sm" variant="export" onClick={exportAllCsv}>
              Export Semua
            </Button>
          </Toolbar>
        }
      >
        {error ? (
          <p className="px-1 py-6 text-center text-sm text-danger">
            {error}
          </p>
        ) : loading ? (
          <p className="px-1 py-6 text-center text-sm text-muted">
            Memuat data sasaran…
          </p>
        ) : rows.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted">
            Tidak ada sasaran di database untuk filter ini.
          </p>
        ) : (
        <DataTable
          columns={[
            { key: "sasaran", label: "Sasaran" },
            { key: "wilayah", label: "Kelurahan" },
            { key: "kunjunganRumah", label: "Kunjungan Rumah" },
            { key: "status", label: "Status" },
            { key: "tgl", label: "Terakhir", sortable: true },
            { key: "aksi", label: "Aksi" },
          ]}
          rows={rows}
          renderRow={(row) => (
            <tr key={row.rawId} className="border-b border-surface-2 last:border-none hover:bg-surface-2">
              <td className="px-3 py-2.5">
                <Link
                  to="/sasaran/$id"
                  params={{ id: row.nik }}
                  className="font-semibold text-accent hover:text-accent-hover"
                >
                  {row.nama}
                </Link>
                {row.needsUpdate ? (
                  <span className="ml-1.5 inline-block rounded bg-warn/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warn">
                    butuh update
                  </span>
                ) : null}
                <div className="text-[11px] text-muted">NIK {row.nik}</div>
              </td>
              <td className="px-3 py-2.5">
                <div className="font-semibold text-ink">Kel. {row.kelurahan}</div>
              </td>
              <td className="px-3 py-2.5 text-muted">{row.kunjunganRumah}×</td>
              <td className="px-3 py-2.5">
                <StatusBadge value={row.status} />
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">{row.tgl ? fmtDate(row.tgl) : "—"}</td>
              <td className="px-3 py-2.5">
                <Link
                  to="/sasaran/$id"
                  params={{ id: row.nik }}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-ink hover:border-accent"
                >
                  Detail
                </Link>
              </td>
            </tr>
          )}
          renderMobileRow={(row) => (
            <div key={row.rawId} className="border-b border-surface-2 last:border-none px-3.5 py-3">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to="/sasaran/$id"
                  params={{ id: row.nik }}
                  className="font-semibold text-accent hover:text-accent-hover"
                >
                  {row.nama}
                </Link>
                <StatusBadge value={row.status} />
              </div>
              <div className="text-[11px] text-muted">NIK {row.nik}</div>
              {row.needsUpdate ? (
                <div className="mt-1 inline-block rounded bg-warn/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warn">
                  butuh update
                </div>
              ) : null}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted">Kel. {row.kelurahan} · {row.kunjunganRumah}× kunjungan rumah</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted">{row.tgl ? fmtDate(row.tgl) : "Belum dikunjungi"}</span>
                <Link
                  to="/sasaran/$id"
                  params={{ id: row.nik }}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-ink hover:border-accent"
                >
                  Detail
                </Link>
              </div>
            </div>
          )}
          info={`Hal ${page} · ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} dari ${total}`}
          page={page}
          canPrev={page > 1}
          canNext={page < maxPage}
          onPrev={() => setFilter({ page: page - 1 })}
          onNext={() => setFilter({ page: page + 1 })}
        />
        )}
      </SectionCard>
    </>
  )
}