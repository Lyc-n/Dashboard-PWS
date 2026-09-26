import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Printer } from "lucide-react";
import { getLaporanKunjungan, listKegiatan } from "@/lib/utils.functions";
import type { KegiatanRecord } from "@/hooks/use-kegiatan";
import { APP_BRAND, JENIS_KEGIATAN, KELS, POSY } from "@/lib/constants";
import { downloadCsv, fmtDate } from "@/lib/utils";
import { useToast } from "@/providers/toast";
import { AppShell, DataTable } from "@/components/organisms";
import { PageHeader, SectionCard, StatCard, Toolbar } from "@/components/molecules";
import { Button, Input, LogoEmblem, ProgressBar, Select, StatusBadge, Tab } from "@/components/atoms";
// [perbaikan] guard konsisten dengan route lain: requireAuth baca cookie httpOnly via server —
//   expect: tanpa sesi valid → redirect /pin (dulu /login); import yang hilang dipulihkan.
import { requireAuth, isAdminUser } from "@/lib/auth";
import { useAuth } from "@/providers/auth";
import { RekapKunjunganSection } from "@/features/laporan/RekapKunjunganSection";

export const Route = createFileRoute("/laporan")({
  beforeLoad: requireAuth,
  loader: async () => {
    const [kunjungan, kegiatan] = await Promise.all([getLaporanKunjungan(), listKegiatan()]);
    return { kunjungan, kegiatan };
  },
  pendingComponent: () => <p className="p-4 text-sm text-muted">Memuat laporan…</p>,
  component: Laporan,
})

const TODAY = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const PAGE_SIZE = 10;

function Laporan() {
  const { kunjungan: rows, kegiatan: kegiatanRaw } = Route.useLoaderData();
  const kegiatanRows = kegiatanRaw as unknown as KegiatanRecord[];
  const toast = useToast();
  const { user } = useAuth();
  const admin = isAdminUser(user);

  const [tab, setTab] = useState<"kunjungan" | "kegiatan" | "rekap">("kunjungan");

  const [dari, setDari] = useState("2026-01-01");
  const [sampai, setSampai] = useState("2026-12-31");
  const [kel, setKel] = useState("all");
  const [cari, setCari] = useState("");
  const [judul, setJudul] = useState("LAPORAN KUNJUNGAN LAPANGAN PWS — KOTA PASURUAN");
  const [ttdNama, setTtdNama] = useState("dr. Ayu Rahmawati");
  const [ttdJabatan, setTtdJabatan] = useState("Kepala Puskesmas Trajeng");
  const [page, setPage] = useState(1);

  // kegiatan filter state
  const [gDari, setGDari] = useState("2026-01-01");
  const [gSampai, setGSampai] = useState("2026-12-31");
  const [gKel, setGKel] = useState("all");
  const [gJenis, setGJenis] = useState("all");
  const [gPosy, setGPosy] = useState("all");
  const [gCari, setGCari] = useState("");
  const [gJudul, setGJudul] = useState("LAPORAN KEGIATAN PEMBERDAYAAN — KOTA PASURUAN");
  const [gPage, setGPage] = useState(1);

  // rekap state
  const [judulRekap, setJudulRekap] = useState("REKAPITULASI KUNJUNGAN RUMAH (KR) — KOTA PASURUAN");

  // non-admin: wilayah tab kunjungan terkunci ke wilayah kader
  const effKel = admin ? kel : (user?.kel ?? "all");

  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        r.tanggal >= dari &&
        r.tanggal <= sampai &&
        (effKel === "all" || r.kelurahan === effKel) &&
        (!cari || r.nama.toLowerCase().includes(cari.toLowerCase()) || r.nik.includes(cari)),
    );
  }, [rows, dari, sampai, effKel, cari]);

  const wargaUnik = new Set(filtered.map((r) => r.nik)).size;

  const kelStats = KELS.map((k) => {
    const sub = filtered.filter((r) => r.kelurahan === k);
    return { kel: k, n: sub.length, done: sub.length, pct: 100 };
  });

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageClamped = Math.min(page, maxPage);
  const pageRows = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE);
  const kopRows = filtered.slice(0, 60);

  const filteredKegiatan = useMemo(() => {
    return kegiatanRows.filter(
      (r) =>
        r.tgl >= gDari &&
        r.tgl <= gSampai &&
        (gKel === "all" || r.kel === gKel) &&
        (gJenis === "all" || r.jenis === gJenis) &&
        (gPosy === "all" || r.posy === gPosy) &&
        (!gCari || r.nama.toLowerCase().includes(gCari.toLowerCase()) || r.pj.toLowerCase().includes(gCari.toLowerCase()) || r.lokasi.toLowerCase().includes(gCari.toLowerCase())),
    );
  }, [kegiatanRows, gDari, gSampai, gKel, gJenis, gPosy, gCari]);

  const totalKegiatan = filteredKegiatan.length;
  const totalPeserta = filteredKegiatan.reduce((a, r) => a + r.total, 0);
  const totalHadir = filteredKegiatan.reduce((a, r) => a + r.hadir, 0);
  const pctHadir = totalPeserta ? Math.round((totalHadir / totalPeserta) * 100) : 0;
  const gKelStats = KELS.map((k) => {
    const sub = filteredKegiatan.filter((r) => r.kel === k);
    return { kel: k, n: sub.length, pct: totalKegiatan ? Math.round((sub.length / totalKegiatan) * 100) : 0 };
  });
  const gJenisStats = JENIS_KEGIATAN.map((j) => {
    const sub = filteredKegiatan.filter((r) => r.jenis === j);
    return { jenis: j, n: sub.length, pct: totalKegiatan ? Math.round((sub.length / totalKegiatan) * 100) : 0 };
  });
  const gMaxPage = Math.max(1, Math.ceil(filteredKegiatan.length / PAGE_SIZE));
  const gPageClamped = Math.min(gPage, gMaxPage);
  const gPageRows = filteredKegiatan.slice((gPageClamped - 1) * PAGE_SIZE, gPageClamped * PAGE_SIZE);
  const gKopRows = filteredKegiatan.slice(0, 60);

  const downloadCsvKunjungan = () => {
    const head = ["No", "Tanggal", "Nama", "NIK", "Kelurahan", "Petugas"];
    const csvRows = filtered.map((r, i) => [i + 1, r.tanggal, r.nama, r.nik, r.kelurahan, r.petugas]);
    downloadCsv("laporan-kunjungan.csv", head, csvRows);
    toast("Laporan kunjungan CSV diunduh.");
  };

  const downloadKegiatanCsv = () => {
    const head = ["No", "Tanggal", "Jam", "Nama", "Jenis", "Kelurahan", "Posyandu", "Lokasi", "PJ", "Target", "Hadir", "Total", "Foto", "Deskripsi"];
    const csvRows = filteredKegiatan.map((r, i) =>
      [i + 1, r.tgl, r.jam, r.nama, r.jenis, r.kel, r.posy, r.lokasi, r.pj, r.target, r.hadir, r.total, r.foto, r.deskripsi],
    );
    downloadCsv("laporan-kegiatan.csv", head, csvRows);
    toast("Laporan kegiatan CSV diunduh.");
  };

  const copySummary = () => {
    const text = [
      `Laporan Kunjungan PWS — Kota Pasuruan`,
      `Periode ${fmtDate(dari)} – ${fmtDate(sampai)}`,
      `Total ${filtered.length} kunjungan · ${wargaUnik} warga unik`,
      `${kelStats.map((s) => `Kel. ${s.kel}: ${s.n}`).join(" · ")}`,
    ].join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => toast("Ringkasan laporan disalin."))
      .catch(() => toast("Gagal menyalin ringkasan."));
  };

  const copyKegiatanSummary = () => {
    const text = [
      `Laporan Kegiatan Pemberdayaan — Kota Pasuruan`,
      `Periode ${fmtDate(gDari)} – ${fmtDate(gSampai)}`,
      `Total ${totalKegiatan} kegiatan · ${totalHadir}/${totalPeserta} hadir (${pctHadir}%)`,
      `${gKelStats.map((s) => `Kel. ${s.kel}: ${s.n}`).join(" · ")}`,
      `${gJenisStats.filter((s) => s.n > 0).map((s) => `${s.jenis}: ${s.n}`).join(" · ")}`,
    ].join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => toast("Ringkasan kegiatan disalin."))
      .catch(() => toast("Gagal menyalin ringkasan."));
  };

  return (
    <AppShell>
      <PageHeader
        title="Laporan & Export"
        description="Rekap kunjungan dan kegiatan pemberdayaan, cetak kop laporan resmi, dan unduh CSV."
      />

      <div role="tablist" aria-label="Laporan" className="mt-4 flex flex-wrap gap-2">
        <Tab active={tab === "kunjungan"} onClick={() => setTab("kunjungan")} role="tab" aria-selected={tab === "kunjungan"}>
          Kunjungan
        </Tab>
        <Tab active={tab === "kegiatan"} onClick={() => setTab("kegiatan")} role="tab" aria-selected={tab === "kegiatan"}>
          Kegiatan Pemberdayaan
        </Tab>
        <Tab active={tab === "rekap"} onClick={() => setTab("rekap")} role="tab" aria-selected={tab === "rekap"}>
          Rekap Kunjungan Rumah
        </Tab>
      </div>

      {tab === "rekap" ? (
        <RekapKunjunganSection
          judul={judulRekap}
          setJudul={setJudulRekap}
          ttdNama={ttdNama}
          setTtdNama={setTtdNama}
          ttdJabatan={ttdJabatan}
          setTtdJabatan={setTtdJabatan}
        />
      ) : tab === "kunjungan" ? (
        <>
          <SectionCard className="no-print" title="Saring Laporan" sub="Filter ikut memperbarui ringkasan, kop, dan pratinjau di bawah.">
            <Toolbar>
              <Input type="date" value={dari} onChange={(e) => setDari(e.target.value)} aria-label="Tanggal awal" className="max-w-[170px] max-md:max-w-none" />
              <Input type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} aria-label="Tanggal akhir" className="max-w-[170px] max-md:max-w-none" />
              <Select value={effKel} onChange={(e) => setKel(e.target.value)} aria-label="Filter kelurahan" className="max-w-[170px] max-md:max-w-none" disabled={!admin}>
                <option value="all">Semua kelurahan</option>
                {KELS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
              <Input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama / NIK…" aria-label="Cari nama" className="max-w-[200px] max-md:max-w-none" />
            </Toolbar>
          </SectionCard>

          <SectionCard className="no-print" title="Ringkasan" sub="Rekap otomatis dari filter di atas.">
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              <StatCard caption="Total kunjungan" value={filtered.length} />
              <StatCard caption="Warga unik" value={wargaUnik} />
              <StatCard caption="Kelurahan tercakup" value={kelStats.filter((s) => s.n > 0).length} />
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
              <Button variant="export" onClick={downloadCsvKunjungan} className="ml-auto">
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
                Periode {fmtDate(dari)} – {fmtDate(sampai)} · {filtered.length} kunjungan · {wargaUnik} warga
              </div>
            </div>

            <div className="mt-4 overflow-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    {["No", "Tanggal", "Nama", "Wilayah", "Petugas", "Status"].map((h) => (
                      <th key={h} className="border-b border-line bg-surface-2 px-2.5 py-2 text-left font-semibold uppercase tracking-wider text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kopRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2.5 py-4 text-center text-muted">
                        Tidak ada data untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    kopRows.map((r, i) => (
                      <tr key={r.id} className="border-b border-[var(--color-surface-2)] last:border-none">
                        <td className="px-2.5 py-2">{i + 1}</td>
                        <td className="whitespace-nowrap px-2.5 py-2">{fmtDate(r.tanggal)}</td>
                        <td className="px-2.5 py-2">
                          <div className="font-semibold">{r.nama}</div>
                          <div className="text-muted">NIK {r.nik}</div>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2">
                          Kel. {r.kelurahan}
                        </td>
                        <td className="px-2.5 py-2 text-muted">{r.petugas}</td>
                        <td className="px-2.5 py-2">
                          <StatusBadge value="Selesai" />
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
            {filtered.length === 0 ? (
              <p className="px-1 py-6 text-center text-sm text-muted">
                Belum ada kunjungan di database untuk filter ini.
              </p>
            ) : (
            <DataTable
              columns={[
                { key: "no", label: "No" },
                { key: "tgl", label: "Tanggal" },
                { key: "nama", label: "Nama" },
                { key: "wilayah", label: "Wilayah" },
                { key: "petugas", label: "Petugas" },
                { key: "status", label: "Status" },
              ]}
              rows={pageRows}
              renderRow={(r, i) => (
                <tr key={r.id} className="border-b border-[var(--color-surface-2)] last:border-none hover:bg-surface-2">
                  <td className="px-3 py-2.5">{(pageClamped - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{fmtDate(r.tanggal)}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-ink">{r.nama}</div>
                    <div className="text-[11px] text-muted">NIK {r.nik}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    Kel. {r.kelurahan}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{r.petugas}</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge value="Selesai" />
                  </td>
                </tr>
              )}
              renderMobileRow={(r) => (
                <div key={r.id} className="border-b border-[var(--color-surface-2)] last:border-none px-3.5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{r.nama}</div>
                      <div className="text-[11px] text-muted">Kel. {r.kelurahan}</div>
                    </div>
                    <StatusBadge value="Selesai" />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted">{fmtDate(r.tanggal)}</span>
                    <span className="text-[11px] text-muted">· {r.petugas}</span>
                  </div>
                </div>
              )}
              toolbar={
                <span className="text-xs font-semibold text-muted">
                  Menampilkan {filtered.length} kunjungan · {wargaUnik} warga
                </span>
              }
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
      ) : (
        <>
          <SectionCard className="no-print" title="Saring Kegiatan" sub="Filter ikut memperbarui ringkasan, kop, dan tabel rekap kegiatan.">
            <Toolbar>
              <Input type="date" value={gDari} onChange={(e) => setGDari(e.target.value)} aria-label="Tanggal awal" className="max-w-[170px] max-md:max-w-none" />
              <Input type="date" value={gSampai} onChange={(e) => setGSampai(e.target.value)} aria-label="Tanggal akhir" className="max-w-[170px] max-md:max-w-none" />
              <Select value={gKel} onChange={(e) => setGKel(e.target.value)} aria-label="Filter kelurahan" className="max-w-[170px] max-md:max-w-none">
                <option value="all">Semua kelurahan</option>
                {KELS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
              <Select value={gJenis} onChange={(e) => setGJenis(e.target.value)} aria-label="Filter jenis kegiatan" className="max-w-[170px] max-md:max-w-none">
                <option value="all">Semua jenis</option>
                {JENIS_KEGIATAN.map((j) => (
                  <option key={j}>{j}</option>
                ))}
              </Select>
              <Select value={gPosy} onChange={(e) => setGPosy(e.target.value)} aria-label="Filter posyandu" className="max-w-[170px] max-md:max-w-none">
                <option value="all">Semua posyandu</option>
                {POSY.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
              <Input value={gCari} onChange={(e) => setGCari(e.target.value)} placeholder="Cari nama/PJ/lokasi…" aria-label="Cari kegiatan" className="max-w-[200px] max-md:max-w-none" />
            </Toolbar>
          </SectionCard>

          <SectionCard className="no-print" title="Ringkasan Kegiatan" sub="Rekap otomatis dari filter kegiatan di atas.">
            <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              <StatCard caption="Total kegiatan" value={totalKegiatan} />
              <StatCard caption="Total peserta" value={totalPeserta} />
              <StatCard caption="Total hadir" value={totalHadir} />
              <StatCard caption="Kehadiran" value={`${pctHadir}%`} progress={pctHadir} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              {gKelStats.map((s) => (
                <div key={s.kel} className="rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3.5 shadow-card">
                  <div className="text-xs font-semibold text-ink">Kel. {s.kel}</div>
                  <div className="mt-0.5 text-[11px] text-muted">{s.n} kegiatan</div>
                  <ProgressBar value={s.pct} className="mt-2" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {gJenisStats.filter((s) => s.n > 0).map((s) => (
                <span key={s.jenis} className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted">
                  {s.jenis}: {s.n}
                </span>
              ))}
              {gJenisStats.filter((s) => s.n > 0).length === 0 ? <span className="text-[11px] text-muted">Belum ada kegiatan.</span> : null}
            </div>
          </SectionCard>

          <SectionCard className="no-print" title="Kop Laporan Kegiatan" sub="Atur judul & penanda tangan, lalu cetak / unduh CSV terpisah.">
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
              <Input value={gJudul} onChange={(e) => setGJudul(e.target.value)} aria-label="Judul laporan kegiatan" />
              <Input value={ttdNama} onChange={(e) => setTtdNama(e.target.value)} aria-label="Nama penanda tangan" />
              <Input value={ttdJabatan} onChange={(e) => setTtdJabatan(e.target.value)} aria-label="Jabatan penanda tangan" />
            </div>
            <Toolbar className="mt-3">
              <span className="text-xs text-muted">{filteredKegiatan.length} kegiatan · 1–{Math.min(gKopRows.length, 60)} ditampilkan di kop.</span>
              <Button variant="export" onClick={downloadKegiatanCsv} className="ml-auto">
                <Download size={14} />
                Unduh CSV Kegiatan
              </Button>
              <Button variant="ghost" onClick={copyKegiatanSummary}>
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
              <b className="text-sm text-ink">{gJudul}</b>
              <div className="mt-1 text-muted">
                Periode {fmtDate(gDari)} – {fmtDate(gSampai)} · {filteredKegiatan.length} kegiatan · {totalHadir}/{totalPeserta} hadir ({pctHadir}%)
              </div>
            </div>
            <div className="mt-4 overflow-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    {["No", "Tanggal", "Nama Kegiatan", "Wilayah", "PJ", "Peserta", "Deskripsi"].map((h) => (
                      <th key={h} className="border-b border-line bg-surface-2 px-2.5 py-2 text-left font-semibold uppercase tracking-wider text-muted">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gKopRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-2.5 py-4 text-center text-muted">Belum ada kegiatan untuk filter ini. Isi di halaman Kegiatan.</td>
                    </tr>
                  ) : (
                    gKopRows.map((r, i) => (
                      <tr key={i} className="border-b border-[var(--color-surface-2)] last:border-none">
                        <td className="px-2.5 py-2">{i + 1}</td>
                        <td className="whitespace-nowrap px-2.5 py-2">{fmtDate(r.tgl)} {r.jam ? `· ${r.jam}` : ""}</td>
                        <td className="px-2.5 py-2">
                          <div className="font-semibold">{r.nama}</div>
                          <div className="text-muted">{r.jenis}</div>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2">Kel. {r.kel} {r.posy ? `· ${r.posy}` : ""} · {r.lokasi}</td>
                        <td className="px-2.5 py-2">{r.pj}</td>
                        <td className="whitespace-nowrap px-2.5 py-2">{r.hadir}/{r.total}</td>
                        <td className="px-2.5 py-2 text-muted">{r.deskripsi || "—"}</td>
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

          <SectionCard className="no-print" title="Tabel Rekap Kegiatan" sub="Data dari halaman Kegiatan, tetap kosong sampai user input. Hadir/total ringkas.">
            <DataTable
              columns={[
                { key: "no", label: "No" },
                { key: "tgl", label: "Tanggal" },
                { key: "nama", label: "Nama & jenis" },
                { key: "wilayah", label: "Wilayah" },
                { key: "pj", label: "PJ" },
                { key: "peserta", label: "Peserta" },
                { key: "deskripsi", label: "Deskripsi" },
              ]}
              rows={gPageRows}
              emptyMessage="Belum ada kegiatan untuk filter ini. Isi di halaman Kegiatan."
              renderRow={(r, i) => (
                <tr key={i} className="border-b border-[var(--color-surface-2)] last:border-none hover:bg-surface-2">
                  <td className="px-3 py-2.5">{(gPageClamped - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {fmtDate(r.tgl)} <span className="text-muted">{r.jam}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-ink">{r.nama}</div>
                    <div className="text-[11px] text-muted">{r.jenis}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div>Kel. {r.kel} {r.posy ? `· ${r.posy}` : ""}</div>
                    <div className="text-[11px] text-muted">{r.lokasi}</div>
                  </td>
                  <td className="px-3 py-2.5">{r.pj}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {r.hadir}/{r.total}
                    <div className="text-[11px] text-muted">{r.foto} foto</div>
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 text-muted">{r.deskripsi || "—"}</td>
                </tr>
              )}
              renderMobileRow={(r, i) => (
                <div key={i} className="border-b border-[var(--color-surface-2)] last:border-none px-3.5 py-3">
                  <div className="font-semibold text-ink">{r.nama}</div>
                  <div className="text-[11px] text-muted">{r.jenis} · {fmtDate(r.tgl)} {r.jam}</div>
                  <div className="mt-1 text-[11px] text-muted">Kel. {r.kel} {r.posy ? `· ${r.posy}` : ""} · {r.lokasi}</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted">PJ: {r.pj}</span>
                    <span className="text-[11px] text-muted">{r.hadir}/{r.total} hadir · {r.foto} foto</span>
                  </div>
                  {r.deskripsi ? <div className="mt-1 text-[11px] text-muted truncate">{r.deskripsi}</div> : null}
                </div>
              )}
              toolbar={
                <span className="text-xs font-semibold text-muted">
                  Menampilkan {filteredKegiatan.length} kegiatan · {totalHadir}/{totalPeserta} hadir ({pctHadir}%)
                </span>
              }
              info={`Hal ${gPageClamped} · ${(gPageClamped - 1) * PAGE_SIZE + 1}–${Math.min(gPageClamped * PAGE_SIZE, filteredKegiatan.length)} dari ${filteredKegiatan.length}`}
              page={gPageClamped}
              canPrev={gPageClamped > 1}
              canNext={gPageClamped < gMaxPage}
              onPrev={() => setGPage((p) => Math.max(1, p - 1))}
              onNext={() => setGPage((p) => Math.min(gMaxPage, p + 1))}
            />
          </SectionCard>
        </>
      )}
    </AppShell>
  )
}
