import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { sasaranRows } from "@/lib/mock-data";
import { fmtDate, initialsOf } from "@/lib/utils";
import { useToast } from "@/lib/toast";
import { DetailHeader } from "@/components/organisms/DetailHeader";
import { InfoPanel } from "@/components/organisms/InfoPanel";
import { SectionCard } from "@/components/molecules/SectionCard";
import { Timeline } from "@/components/organisms/Timeline";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Button } from "@/components/atoms/Button";
import { Tag } from "@/components/atoms/Tag";
import { StatusBadge } from "@/components/atoms/StatusBadge";

export const Route = createFileRoute("/sasaran/$id")({
  component: SasaranDetail,
})

function SasaranDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const rows = sasaranRows();
  let idx = Number.parseInt(id, 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= rows.length) idx = 0;
  const row = rows[idx];

  const [localStatus, setLocalStatus] = useState(row.status);

  const markVisited = () => {
    if (localStatus === "Sudah") {
      toast(`Checklist ${row.nama} sudah tercatat hari ini — tidak ada perubahan.`);
      return;
    }
    setLocalStatus("Sudah");
    toast(`Status ${row.nama} diperbarui menjadi Sudah.`);
  };

  const note =
    localStatus === "Belum" ? {
      cls: "border-[var(--color-status-belum-border)] bg-[var(--color-status-belum-bg)] text-[var(--color-status-belum-text)]",
      title: "Belum melakukan pemeriksaan.",
      desc: "Sasaran ini belum dikunjungi. Jadwalkan kunjungan rumah atau input lewat form checklist.",
    } : localStatus === "Terjadwal" ? {
      cls: "border-[var(--color-status-jadwal-border)] bg-[var(--color-status-jadwal-bg)] text-[var(--color-status-jadwal-text)]",
      title: "Menunggu jadwal kunjungan.",
      desc: `Kunjungan dijadwalkan ulang pada ${fmtDate(row.tgl)}.`,
    } : {
      cls: "border-[var(--color-status-done-border)] bg-[var(--color-status-done-bg)] text-[var(--color-status-done-text)]",
      title: "Sudah diperiksa.",
      desc: `Terakhir diperiksa pada ${fmtDate(row.tgl)} di ${row.lokasi}.`,
    };

  return (
    <>
      <PageHeader title={`Detail Sasaran #${idx + 1}`} description={`${row.nama} — NIK ${row.nik}`} />

      <DetailHeader
        breadcrumb={[
          { label: "Dashboard", href: "/" },
          { label: "Data Sasaran", href: "/sasaran" },
          { label: row.nama },
        ]}
        onBack={() => navigate({ to: "/sasaran" })}
        title={
          <span className="flex items-center gap-2">
            {row.nama}
            <Tag priority={row.prior} />
          </span>
        }
        meta={`NIK ${row.nik} · Kel. ${row.kel} · Posyandu ${row.posy} · Inisial ${initialsOf(row.nama)}`}
        actions={
          <>
            <Button
              variant="default"
              onClick={() => toast(`Memanggil ${row.nama} (0812-3456-7890)…`)}
            >
              Hubungi
            </Button>
            <Button variant="primary" onClick={markVisited}>
              Tandai Sudah Diperiksa
            </Button>
          </>
        }
      />

      <div className={`no-print mt-3.5 rounded-[10px] border p-3.5 text-xs ${note.cls}`}>
        <b>{note.title}</b>
        <span> {note.desc}</span>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-3.5 max-md:grid-cols-1">
        <SectionCard title="Identitas Sasaran" sub="Data pokok dari kartu kunjungan.">
          <InfoPanel
            columns={1}
            fields={[
              { label: "Nama", value: row.nama },
              { label: "NIK", value: row.nik },
              { label: "Kelurahan", value: `Kel. ${row.kel}` },
              { label: "Posyandu terdekat", value: row.posy },
              { label: "Kader pendamping", value: "Siti Aminah" },
              { label: "Alamat", value: "Jl. Trajeng gg. II no. 8" },
            ]}
          />
        </SectionCard>

        <SectionCard title="Ringkasan Pemeriksaan" sub="Status kunjungan terakhir.">
          <InfoPanel
            columns={1}
            fields={[
              { label: "Status terakhir", value: <StatusBadge value={localStatus} /> },
              { label: "Lokasi terakhir", value: row.lokasi },
              { label: "Hasil terakhir", value: "Perlu kontrol ulang / rujuk PKM" },
              { label: "Dijadwalkan ulang", value: fmtDate(row.tgl) },
              { label: "Prioritas", value: row.prior },
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Catatan Kader"
        sub="Riwayat ringkas dari kunjungan rutin."
        actions={
          <Link
            to="/kegiatan"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-surface px-[10px] py-1.5 text-xs font-bold text-ink-2 transition-colors hover:border-accent"
          >
            Laporan kunjungan kader
          </Link>
        }
      >
        <Timeline
          title="Riwayat Kunjungan"
          items={[
            {
              date: "17 Feb 2026",
              title: "Kunjungan Rumah — Selesai",
              description: "Tekanan darah normal, keluhan terkendali. BB/CC diplot ke KMS.",
            },
            {
              date: "28 Feb 2026",
              title: "Kunjungan Rumah — Selesai",
              description: "Kontrol terjadwal, obat rutin diminum. Tanda bahaya tidak ditemukan.",
            },
            {
              date: fmtDate(row.tgl),
              title: "Kunjungan Rumah — Terjadwal",
              description: "Dijadwalkan ulang kontrol rutin bulanan.",
              done: localStatus !== "Belum",
            },
          ]}
        />
      </SectionCard>
    </>
  )
}