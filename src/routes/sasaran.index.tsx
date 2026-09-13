import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { sasaranRows } from "@/lib/mock-data";
import { KELS, PRIOS, POSY } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import { DataTable } from "@/components/organisms/DataTable";
import { FilterCard } from "@/components/organisms/FilterCard";
import { SectionCard } from "@/components/molecules/SectionCard";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Toolbar } from "@/components/molecules/Toolbar";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Button } from "@/components/atoms/Button";
import { Tag } from "@/components/atoms/Tag";
import { StatusBadge } from "@/components/atoms/StatusBadge";

export const Route = createFileRoute("/sasaran/")({
  component: Sasaran,
})

function Sasaran() {
  const rows = useMemo(() => sasaranRows(), []);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [prio, setPrio] = useState("all");
  const [kel, setKel] = useState("all");
  const [posy, setPosy] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        (prio === "all" || r.prior === prio) &&
        (kel === "all" || r.kel === kel) &&
        (posy === "all" || r.posy === posy) &&
        (!q ||
          r.nama.toLowerCase().includes(q.toLowerCase()) ||
          r.nik.includes(q)),
    );
  }, [rows, status, prio, kel, posy, q]);

  const filteredWithIdx = useMemo(
    () => filtered.map((r) => ({ row: r, idx: rows.indexOf(r) })),
    [filtered, rows],
  );

  const doneCount = filtered.filter((r) => r.status === "Sudah").length;
  const belumCount = filtered.filter((r) => r.status === "Belum").length;

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, maxPage);
  const pageRows = filteredWithIdx.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);

  const reset = () => {
    setQ("");
    setStatus("all");
    setPrio("all");
    setKel("all");
    setPosy("all");
    setPage(1);
  };

  const exportCsv = () => {
    const head = ["No", "Tanggal", "Nama", "NIK", "Kelurahan", "Posyandu", "Prioritas", "Status"];
    const lines = filtered.map(
      (r, i) =>
        [i + 1, r.tgl, r.nama, r.nik, r.kel, r.posy, r.prior, r.status].join(","),
    );
    const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data-sasaran.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Data Sasaran"
        description="Daftar warga dengan kunjungan rumah dari Puskesmas Kelurahan Trajeng, Kota Pasuruan."
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
            className="max-w-60"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter status"
            className="max-w-45"
          >
            <option value="all">Semua status</option>
            <option>Sudah</option>
            <option>Belum</option>
            <option>Terjadwal</option>
          </Select>
          <Select
            value={prio}
            onChange={(e) => {
              setPrio(e.target.value);
              setPage(1);
            }}
            aria-label="Filter prioritas"
            className="max-w-45"
          >
            <option value="all">Semua prioritas</option>
            {PRIOS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
          <Select
            value={kel}
            onChange={(e) => {
              setKel(e.target.value);
              setPage(1);
            }}
            aria-label="Filter kelurahan"
            className="max-w-45"
          >
            <option value="all">Semua kelurahan</option>
            {KELS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
          <Select
            value={posy}
            onChange={(e) => {
              setPosy(e.target.value);
              setPage(1);
            }}
            aria-label="Filter posyandu"
            className="max-w-45"
          >
            <option value="all">Semua posyandu</option>
            {POSY.map((p) => (
              <option key={p}>{p}</option>
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
        <DataTable
          columns={[
            { key: "sasaran", label: "Sasaran" },
            { key: "wilayah", label: "Kelurahan · Posyandu" },
            { key: "prior", label: "Prioritas" },
            { key: "status", label: "Status" },
            { key: "tgl", label: "Tgl.", sortable: true },
            { key: "lokasi", label: "Lokasi" },
            { key: "aksi", label: "Aksi" },
          ]}
          rows={pageRows}
          renderRow={({ row, idx }, i) => (
            <tr key={i} className="border-b border-surface-2 last:border-none hover:bg-surface-2">
              <td className="px-3 py-2.5">
                <Link
                  to="/sasaran/$id"
                  params={{ id: String(idx) }}
                  className="font-semibold text-accent hover:text-accent-hover"
                >
                  {row.nama}
                </Link>
                <div className="text-[11px] text-muted">NIK {row.nik}</div>
              </td>
              <td className="px-3 py-2.5">
                <div className="font-semibold text-ink">Kel. {row.kel}</div>
                <div className="text-[11px] text-muted">{row.posy}</div>
              </td>
              <td className="px-3 py-2.5">
                <Tag priority={row.prior} />
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge value={row.status} />
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(row.tgl)}</td>
              <td className="px-3 py-2.5 text-muted">{row.lokasi}</td>
              <td className="px-3 py-2.5">
                <Link
                  to="/sasaran/$id"
                  params={{ id: String(idx) }}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-bold text-ink hover:border-accent"
                >
                  Detail
                </Link>
              </td>
            </tr>
          )}
          info={`Hal ${pageClamped} · ${(pageClamped - 1) * PAGE_SIZE + 1}–${Math.min(pageClamped * PAGE_SIZE, filtered.length)} dari ${filtered.length}`}
          page={pageClamped}
          canPrev={pageClamped > 1}
          canNext={pageClamped < maxPage}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
        />
      </SectionCard>
    </>
  )
}