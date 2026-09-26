import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getSasaranList } from "@/lib/utils.functions";
import { requireAuth } from "@/lib/auth";
import { KELS } from "@/lib/constants";
import { downloadCsv, fmtDate } from "@/lib/utils";
import { DataTable, FilterCard } from "@/components/organisms";
import { PageHeader, SectionCard, Toolbar } from "@/components/molecules";
import { Button, Input, Select, StatusBadge } from "@/components/atoms";

export const Route = createFileRoute("/sasaran/")({
  beforeLoad: requireAuth,
  loader: async () => await getSasaranList(),
  pendingComponent: () => <p className="p-4 text-sm text-muted">Memuat data sasaran…</p>,
  component: Sasaran,
})

function Sasaran() {
  const rows = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [kel, setKel] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (kel === "all" || r.kelurahan === kel) &&
        (!q ||
          r.nama.toLowerCase().includes(q.toLowerCase()) ||
          r.nik.includes(q)),
    );
  }, [rows, status, kel, q]);

  const doneCount = filtered.filter((r) => r.status === "Sudah").length;
  const belumCount = filtered.filter((r) => r.status === "Belum").length;

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, maxPage);
  const pageRows = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  const reset = () => {
    setQ("");
    setStatus("all");
    setKel("all");
    setPage(1);
  };

  const exportCsv = () => {
    const head = ["No", "Tanggal Terakhir", "Nama", "NIK", "Kelurahan", "Kunjungan", "Status"];
    const csvRows = filtered.map((r, i) => [i + 1, r.tgl ?? "—", r.nama, r.nik, r.kelurahan, r.kunjungan, r.status]);
    downloadCsv("data-sasaran.csv", head, csvRows);
  };

  return (
    <>
      <PageHeader
        title="Data Sasaran"
        description="Daftar warga dari database beserta status kunjungannya."
      />

      <FilterCard title="Saring Data" sub="Temukan sasaran tertentu dengan cepat.">
        <Toolbar>
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama atau NIK…"
            aria-label="Cari sasaran"
            className="max-w-60 max-md:max-w-none"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter status"
            className="max-w-45 max-md:max-w-none"
          >
            <option value="all">Semua status</option>
            <option>Sudah</option>
            <option>Belum</option>
          </Select>
          <Select
            value={kel}
            onChange={(e) => {
              setKel(e.target.value);
              setPage(1);
            }}
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
              {filtered.length} sasaran · {doneCount} Sudah · {belumCount} Belum
            </span>
            <Button size="sm" onClick={reset}>
              Reset
            </Button>
            <Button size="sm" variant="export" onClick={exportCsv}>
              Export CSV
            </Button>
          </Toolbar>
        }
      >
        {filtered.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-muted">
            Tidak ada sasaran di database untuk filter ini.
          </p>
        ) : (
        <DataTable
          columns={[
            { key: "sasaran", label: "Sasaran" },
            { key: "wilayah", label: "Kelurahan" },
            { key: "kunjungan", label: "Kunjungan" },
            { key: "status", label: "Status" },
            { key: "tgl", label: "Terakhir", sortable: true },
            { key: "aksi", label: "Aksi" },
          ]}
          rows={pageRows}
          renderRow={(row) => (
            <tr key={row.nik} className="border-b border-surface-2 last:border-none hover:bg-surface-2">
              <td className="px-3 py-2.5">
                <Link
                  to="/sasaran/$id"
                  params={{ id: row.nik }}
                  className="font-semibold text-accent hover:text-accent-hover"
                >
                  {row.nama}
                </Link>
                <div className="text-[11px] text-muted">NIK {row.nik}</div>
              </td>
              <td className="px-3 py-2.5">
                <div className="font-semibold text-ink">Kel. {row.kelurahan}</div>
              </td>
              <td className="px-3 py-2.5 text-muted">{row.kunjungan}×</td>
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
            <div key={row.nik} className="border-b border-surface-2 last:border-none px-3.5 py-3">
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
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted">Kel. {row.kelurahan} · {row.kunjungan}× kunjungan</span>
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
          info={`Hal ${pageClamped} · ${(pageClamped - 1) * PAGE_SIZE + 1}–${Math.min(pageClamped * PAGE_SIZE, filtered.length)} dari ${filtered.length}`}
          page={pageClamped}
          canPrev={pageClamped > 1}
          canNext={pageClamped < maxPage}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
        />
        )}
      </SectionCard>
    </>
  )
}
