import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { laporanRows } from "@/lib/mock-data";
import { APP_BRAND, KELS, POSY, PRIOS, SUMBER_PERIKSA, STATUS_DEFAULT } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { AppShell } from "@/components/organisms/AppShell";
import { DataTable } from "@/components/organisms/DataTable";
import { SectionCard } from "@/components/molecules/SectionCard";
import { StatCard } from "@/components/molecules/StatCard";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Toolbar } from "@/components/molecules/Toolbar";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Button } from "@/components/atoms/Button";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { Tag } from "@/components/atoms/Tag";
import { LogoEmblem } from "@/components/atoms/LogoEmblem";


export const Route = createFileRoute("/laporan")({
  component: Laporan,
})

const TODAY = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const PAGE_SIZE = 10;

function Laporan() {
  const rows = useMemo(() => laporanRows(), []);
  const toast = useToast();

  const [dari, setDari] = useState("2026-01-01");
  const [sampai, setSampai] = useState("2026-03-31");
  const [kel, setKel] = useState("all");
  const [prior, setPrior] = useState("all");
  const [posy, setPosy] = useState("all");
  const [status, setStatus] = useState("all");
  const [sumber, setSumber] = useState("all");
  const [cari, setCari] = useState("");
  const [judul, setJudul] = useState("LAPORAN KUNJUNGAN LAPANGAN PWS — KOTA PASURUAN");
  const [ttdNama, setTtdNama] = useState("dr. Ayu Rahmawati");
  const [ttdJabatan, setTtdJabatan] = useState("Kepala Puskesmas Trajeng");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        r.tgl >= dari &&
        r.tgl <= sampai &&
        (kel === "all" || r.kel === kel) &&
        (prior === "all" || r.prior === prior) &&
        (posy === "all" || r.posy === posy) &&
        (status === "all" || r.status === status) &&
        (sumber === "all" || r.sumber === sumber) &&
        (!cari || r.nama.toLowerCase().includes(cari.toLowerCase())),
    );
  }, [rows, dari, sampai, kel, prior, posy, status, sumber, cari]);

  const pctSelesai = filtered.length ? Math.round((filtered.filter((r) => r.status === "Selesai").length / filtered.length) * 100) : 0;
  const perluTindak = filtered.filter((r) => r.status === "Perlu tindak lanjut").length;
  const terjadwal = filtered.filter((r) => r.status === "Terjadwal").length;

  const kelStats = KELS.map((k) => {
    const sub = filtered.filter((r) => r.kel === k);
    const done = sub.filter((r) => r.status === "Selesai").length;
    return { kel: k, n: sub.length, done, pct: sub.length ? Math.round((done / sub.length) * 100) : 0 };
  });

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, maxPage);
  const pageRows = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);
  const kopRows = filtered.slice(0, 60);

  const downloadCsv = () => {
    const head = ["No", "Tanggal", "Nama", "Prioritas", "Kelurahan", "Posyandu", "Sumber", "Hasil", "Status"];
    const lines = filtered.map(
      (r, i) => [i + 1, r.tgl, r.nama, r.prior, r.kel, r.posy, r.sumber, r.hasil, r.status].join(","),
    );
    const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-kunjungan.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("Laporan CSV diunduh.");
  };

  const copySummary = () => {
    const text = [
      `Laporan Kunjungan PWS — Kota Pasuruan`,
      `Periode ${fmtDate(dari)} – ${fmtDate(sampai)}`,
      `Total ${filtered.length} kunjungan · ${pctSelesai}% selesai · ${perluTindak} perlu tindak lanjut · ${terjadwal} terjadwal`,
      `${kelStats.map((s) => `Kel. ${s.kel}: ${s.done}/${s.n} selesai`).join(" · ")}`,
    ].join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => toast("Ringkasan laporan disalin."))
      .catch(() => toast("Gagal menyalin ringkasan."));
  };

  return (
    <AppShell>
      <PageHeader
        title="Laporan & Export"
        description="Rekap kunjungan, cetak kop laporan resmi, dan unduh data dalam format CSV."
      />

      <SectionCard className="no-print" title="Saring Laporan" sub="Filter ikut memperbarui ringkasan, kop, dan pratinjau di bawah.">
        <Toolbar>
          <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} aria-label="Tanggal awal" className="max-w-[170px]" />
          <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} aria-label="Tanggal akhir" className="max-w-[170px]" />
          <Select value={kel} onChange={(e) => setKel(e.target.value)} aria-label="Filter kelurahan" className="max-w-[170px]">
            <option value="all">Semua kelurahan</option>
            {KELS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </Select>
          <Select value={prior} onChange={(e) => setPrior(e.target.value)} aria-label="Filter prioritas" className="max-w-[170px]">
            <option value="all">Semua prioritas</option>
            {PRIOS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
          <Select value={posy} onChange={(e) => setPosy(e.target.value)} aria-label="Filter posyandu" className="max-w-[170px]">
            <option value="all">Semua posyandu</option>
            {POSY.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status" className="max-w-[170px]">
            <option value="all">Semua status</option>
            {STATUS_DEFAULT.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select value={sumber} onChange={(e) => setSumber(e.target.value)} aria-label="Filter sumber" className="max-w-[170px]">
            <option value="all">Semua sumber</option>
            {SUMBER_PERIKSA.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama…" aria-label="Cari nama" className="max-w-[200px]" />
        </Toolbar>
      </SectionCard>

      <SectionCard className="no-print" title="Ringkasan" sub="Rekap otomatis dari filter di atas.">
        <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          <StatCard caption="Total kunjungan" value={filtered.length} />
          <StatCard caption="Cakupan selesai" value={`${pctSelesai}%`} progress={pctSelesai} />
          <StatCard caption="Perlu tindak lanjut" value={perluTindak} progress={Math.min(100, Math.round((perluTindak * 100) / 24))} />
          <StatCard caption="Terjadwal" value={terjadwal} progress={Math.min(100, Math.round((terjadwal * 100) / 24))} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
          {kelStats.map((s) => (
            <div key={s.kel} className="rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3.5 shadow-card">
              <div className="text-xs font-semibold text-ink">Kel. {s.kel}</div>
              <div className="mt-0.5 text-[11px] text-muted">
                {s.done} dari {s.n} selesai
              </div>
              <ProgressBar value={s.pct} className="mt-2" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="no-print" title="Kop Laporan" sub="Atur judul & penanda tangan, lalu cetak / unduh.">
        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          <Input value={judul} onChange={(e) => setJudul(e.target.value)} aria-label="Judul laporan" />
          <Input value={ttdNama} onChange={(e) => setTtdNama(e.target.value)} aria-label="Nama penanda tangan" />
          <Input value={ttdJabatan} onChange={(e) => setTtdJabatan(e.target.value)} aria-label="Jabatan penanda tangan" />
        </div>
        <Toolbar className="mt-3">
          <span className="text-xs text-muted">{filtered.length} baris · 1–{Math.min(kopRows.length, 60)} ditampilkan di kop.</span>
          <Button variant="export" onClick={downloadCsv} className="ml-auto">
            <Download size={14} />
            Unduh CSV
          </Button>
          <Button variant="ghost" onClick={copySummary}>
            Salin ringkasan
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer size={14} />
            Cetak / Simpan PDF
          </Button>
        </Toolbar>
      </SectionCard>

      <div className="mt-3.5 rounded-[10px] border border-dashed border-line bg-surface p-4 text-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <LogoEmblem />
            <div className="text-[11px] leading-tight">
              <b className="block text-ink">
                {APP_BRAND.name} <span className="font-semibold">{APP_BRAND.region}</span>
              </b>
              <span className="text-muted">Puskesmas Trajeng · Jl. Panglima Sudirman 12, Kota Pasuruan</span>
            </div>
          </div>
          <span className="text-[10px] text-muted">Dicetak: {TODAY}</span>
        </div>

        <div className="mt-5 text-center">
          <b className="text-sm text-ink">{judul}</b>
          <div className="mt-1 text-muted">
            Periode {fmtDate(dari)} – {fmtDate(sampai)} · {filtered.length} kunjungan · {pctSelesai}% selesai
          </div>
        </div>

        <div className="mt-4 overflow-auto rounded-lg border border-line">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                {["No", "Tanggal", "Nama & prioritas", "Wilayah", "Sumber", "Hasil", "Status"].map((h) => (
                  <th key={h} className="border-b border-line bg-surface-2 px-2.5 py-2 text-left font-semibold uppercase tracking-wider text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kopRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2.5 py-4 text-center text-muted">
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              ) : (
                kopRows.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--color-surface-2)] last:border-none">
                    <td className="px-2.5 py-2">{i + 1}</td>
                    <td className="whitespace-nowrap px-2.5 py-2">{fmtDate(r.tgl)}</td>
                    <td className="px-2.5 py-2">
                      <Tag priority={r.prior} />
                      <div className="mt-0.5 font-semibold">{r.nama}</div>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-2">
                      Kel. {r.kel} · {r.posy}
                    </td>
                    <td className="px-2.5 py-2 text-muted">{r.sumber}</td>
                    <td className="px-2.5 py-2 text-muted">{r.hasil}</td>
                    <td className="px-2.5 py-2">
                      <StatusBadge value={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid justify-items-end">
          <div className="text-center text-[11px]">
            <div className="text-muted">Kota Pasuruan, {TODAY}</div>
            <div className="mt-9 font-semibold text-ink">{ttdNama}</div>
            <div className="mt-0.5 text-muted">{ttdJabatan}</div>
          </div>
        </div>
      </div>

      <SectionCard className="no-print" title="Pratinjau Data" sub="Lihat daftar lengkap dengan navigasi halaman.">
        <DataTable
          columns={[
            { key: "no", label: "No" },
            { key: "tgl", label: "Tanggal" },
            { key: "nama", label: "Nama & prioritas" },
            { key: "wilayah", label: "Wilayah" },
            { key: "sumber", label: "Sumber" },
            { key: "hasil", label: "Hasil" },
            { key: "status", label: "Status" },
          ]}
          rows={pageRows}
          renderRow={(r, i) => (
            <tr key={i} className="border-b border-[var(--color-surface-2)] last:border-none hover:bg-surface-2">
              <td className="px-3 py-2.5">{(pageClamped - 1) * PAGE_SIZE + i + 1}</td>
              <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(r.tgl)}</td>
              <td className="px-3 py-2.5">
                <Tag priority={r.prior} />
                <div className="mt-1 font-semibold text-ink">{r.nama}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                Kel. {r.kel} · {r.posy}
              </td>
              <td className="px-3 py-2.5 text-muted">{r.sumber}</td>
              <td className="px-3 py-2.5 text-muted">{r.hasil}</td>
              <td className="px-3 py-2.5">
                <StatusBadge value={r.status} />
              </td>
            </tr>
          )}
          toolbar={
            <span className="text-xs font-semibold text-muted">
              Menampilkan {filtered.length} kunjungan · {pctSelesai}% selesai
            </span>
          }
          info={`Hal ${pageClamped} · ${(pageClamped - 1) * PAGE_SIZE + 1}–${Math.min(pageClamped * PAGE_SIZE, filtered.length)} dari ${filtered.length}`}
          page={pageClamped}
          canPrev={pageClamped > 1}
          canNext={pageClamped < maxPage}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(maxPage, p + 1))}
        />
      </SectionCard>
    </AppShell>
  )
}