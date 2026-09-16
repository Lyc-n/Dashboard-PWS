import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useKegiatan  } from "@/hooks/use-kegiatan";
import type {KegiatanRecord} from "@/hooks/use-kegiatan";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { JENIS_KEGIATAN, KELS, POSY, STORAGE_KEYS } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import { useToast } from "@/providers/toast";
import { AppShell } from "@/components/organisms/AppShell";
import { DokumentasiPanel } from "@/components/organisms/DokumentasiPanel";
import { HistoryPanel } from "@/components/organisms/HistoryPanel";
import { PesertaPanel } from "@/components/organisms/PesertaPanel";
import { SuccessPanel } from "@/components/organisms/SuccessPanel";
import { SectionCard } from "@/components/molecules/SectionCard";
import { Stepper  } from "@/components/molecules/Stepper";
import type {Step} from "@/components/molecules/Stepper";
import { FillBar } from "@/components/molecules/FillBar";
import { HistoryRow } from "@/components/molecules/HistoryRow";

import { FormField } from "@/components/molecules/FormField";
import { Toolbar } from "@/components/molecules/Toolbar";
import { PageHeader } from "@/components/molecules/PageHeader";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Textarea } from "@/components/atoms/Textarea";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { requireAuth } from "@/lib/auth";

export const Route = createFileRoute("/kegiatan")({
  beforeLoad: requireAuth,
  component: Kegiatan,
})

function Kegiatan() {
  const k = useKegiatan();
  const toast = useToast();
  const [records, setRecords] = useLocalStorage<KegiatanRecord[]>(STORAGE_KEYS.kegiatan, []);
  const [saved, setSaved] = useState<KegiatanRecord | null>(null);
  const [fotoErr, setFotoErr] = useState("");

  const n = k.peserta.length ? 3 : k.fields.nama ? 2 : 1;
  const steps: Step[] = [
    { label: "Identitas", state: n > 1 ? "done" : "now" },
    { label: "Peserta", state: n > 2 ? "done" : n === 2 ? "now" : "todo" },
    { label: "Dokumentasi", state: n === 3 ? "now" : "todo" },
    { label: "Simpan", state: "todo" },
  ];

  const handleFiles = (files: File[]) => {
    const skipped = k.addFiles(files);
    if (skipped > 0) {
      setFotoErr(`${skipped} berkas dilewati — bukan foto, >2 MB, atau kuota 6 foto penuh.`);
      toast(`${skipped} berkas dilewati (bukan foto / >2 MB / maks. 6 foto).`);
    } else {
      setFotoErr("");
    }
  };

  const handleSubmit = () => {
    const r = k.submit();
    if (!r) {
      toast("Periksa kembali isian yang wajib diisi.");
      return;
    }
    setRecords((prev) => [...prev, r]);
    setSaved(r);
    toast(`Kegiatan ${r.nama} tersimpan.`);
  };

  const handleNext = () => {
    k.clearAll();
    setSaved(null);
    setFotoErr("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppShell>
      <PageHeader
        title="Kegiatan Pemberdayaan"
        description="Catat kegiatan pemberdayaan masyarakat, kehadiran peserta, dan dokumentasi foto."
      />

      <Stepper steps={steps} />
      <FillBar label="Kelengkapan form" pct={k.fillPercent} />

      <SectionCard title="1. Identitas Kegiatan" sub="Data pokok kegiatan." bodyClassName="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <FormField label="Nama kegiatan" required invalid={!!k.invalid.nama} error="Wajib diisi.">
          <Input value={k.fields.nama} onChange={(e) => k.setField("nama", e.target.value)} placeholder="cth. Penyuluhan Gizi Balita" invalid={!!k.invalid.nama} />
        </FormField>
        <FormField label="Penanggung jawab" required invalid={!!k.invalid.pj} error="Wajib diisi.">
          <Input value={k.fields.pj} onChange={(e) => k.setField("pj", e.target.value)} placeholder="cth. Siti Aminah" invalid={!!k.invalid.pj} />
        </FormField>
        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          <FormField label="Tanggal" required invalid={!!k.invalid.tgl} error="Wajib diisi.">
            <Input type="date" value={k.fields.tgl} onChange={(e) => k.setField("tgl", e.target.value)} invalid={!!k.invalid.tgl} />
          </FormField>
          <FormField label="Jam">
            <Input type="time" value={k.fields.jam} onChange={(e) => k.setField("jam", e.target.value)} />
          </FormField>
          <FormField label="Target peserta">
            <Input value={k.fields.target} onChange={(e) => k.setField("target", e.target.value)} placeholder="cth. 25 ibu" />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard title="2. Kelurahan & Lokasi" sub="Lokasi pelaksanaan." bodyClassName="grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <FormField label="Jenis kegiatan">
          <Select value={k.jenis} onChange={(e) => k.setJenis(e.target.value)}>
            {JENIS_KEGIATAN.map((j) => (
              <option key={j}>{j}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Kelurahan" required invalid={!!k.invalid.kel} error="Wajib diisi.">
          <Select value={k.fields.kel} onChange={(e) => k.setField("kel", e.target.value)} invalid={!!k.invalid.kel}>
            <option value="">— Pilih —</option>
            {KELS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Posyandu">
          <Select value={k.fields.posy} onChange={(e) => k.setField("posy", e.target.value)}>
            <option value="">— Pilih —</option>
            {POSY.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Lokasi" required invalid={!!k.invalid.lokasi} error="Wajib diisi.">
          <Input value={k.fields.lokasi} onChange={(e) => k.setField("lokasi", e.target.value)} placeholder="cth. Balai RW 02" invalid={!!k.invalid.lokasi} />
        </FormField>
        <FormField label="Deskripsi kegiatan" className="md:col-span-3">
          <Textarea value={k.fields.deskripsi} onChange={(e) => k.setField("deskripsi", e.target.value)} placeholder="Rencana singkat, materi, metode…" />
        </FormField>
      </SectionCard>

      <SectionCard title="3. Peserta & Kehadiran" sub="Tambahkan peserta kegiatan.">
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <b className="text-[13px] text-ink">Daftar Peserta</b>
            <Badge variant="ok">{k.hadirCount} hadir dari {k.peserta.length}</Badge>
          </div>
          <PesertaPanel
            participants={k.peserta}
            onAdd={k.addPeserta}
            onToggle={k.togglePeserta}
            onRemove={k.removePeserta}
          />
          {k.pesertaEmpty ? (
            <span className="text-[11px] font-semibold text-danger">Tambahkan minimal 1 peserta.</span>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="4. Dokumentasi" sub="Min. 3 foto kegiatan, maks. 6.">
        <DokumentasiPanel
          fotos={k.fotos}
          onAddFiles={handleFiles}
          onSetCaption={k.setCaption}
          onRemoveFoto={k.removeFoto}
        />
        {fotoErr ? <span className="mt-2 block text-[11px] font-semibold text-danger">{fotoErr}</span> : null}
      </SectionCard>

      <SectionCard
        title="5. Simpan"
        actions={
          <Toolbar className="w-full">
            <span className="ml-auto text-xs text-muted">Simpan ke riwayat lokal perangkat ini.</span>
            <Button variant="default" onClick={k.clearAll}>
              Reset
            </Button>
            <Button variant="ghost" onClick={k.loadDemo}>
              Isi contoh
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Simpan kegiatan
            </Button>
          </Toolbar>
        }
      >
        <span className="text-xs text-muted">Pastikan seluruh isian bercentang hijau sebelum menyimpan.</span>
      </SectionCard>

      {saved ? (
        <SuccessPanel
          title={`Kegiatan ${saved.nama} tersimpan.`}
          message="Data tercatat di riwayat lokal; tim dapat menambah kegiatan lainnya."
        >
          <Button variant="primary" onClick={handleNext}>
            Catat kegiatan berikutnya
          </Button>
          <Link
            to="/sasaran"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-accent bg-accent px-[18px] py-[11px] text-[13px] font-bold text-white hover:bg-accent-hover"
          >
            Lihat Data Sasaran
          </Link>
        </SuccessPanel>
      ) : null}

      <SectionCard title="Riwayat Kegiatan" sub="Data tersimpan di perangkat ini.">
        <HistoryPanel
          items={records.map((r, i) => (
            <HistoryRow key={i} layout="stack">
              <div className="flex flex-wrap items-center gap-2">
                <b>{r.nama}</b>
                <span className="text-muted">· {r.jenis}</span>
              </div>
              <span className="text-muted">
                {fmtDate(r.tgl)} {r.jam ? `pukul ${r.jam}` : ""} · {r.lokasi}
              </span>
              <span className="text-muted">
                Kel. {r.kel} {r.posy ? `· Posyandu ${r.posy}` : ""} · {r.hadir}/{r.total} hadir · {r.foto} foto
              </span>
            </HistoryRow>
          ))}
        />
      </SectionCard>
    </AppShell>
  )
}