import type { ReactNode } from "react";
import { Download, Printer } from "lucide-react";
import { SectionCard, Toolbar } from "@/components/molecules";
import { Button, Input } from "@/components/atoms";

export interface KopSectionProps {
  title: string;
  sub: string;
  judul: string;
  setJudul: (v: string) => void;
  judulLabel: string;
  ttdNama: string;
  setTtdNama: (v: string) => void;
  ttdJabatan: string;
  setTtdJabatan: (v: string) => void;
  countText: ReactNode;
  csvLabel?: string;
  onDownloadCsv: () => void;
  onCopySummary: () => void;
}

export function KopSection({
  title,
  sub,
  judul,
  setJudul,
  judulLabel,
  ttdNama,
  setTtdNama,
  ttdJabatan,
  setTtdJabatan,
  countText,
  csvLabel = "Unduh CSV",
  onDownloadCsv,
  onCopySummary,
}: KopSectionProps) {
  return (
    <SectionCard className="no-print" title={title} sub={sub}>
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <Input value={judul} onChange={(e) => setJudul(e.target.value)} aria-label={judulLabel} />
        <Input value={ttdNama} onChange={(e) => setTtdNama(e.target.value)} aria-label="Nama penanda tangan" />
        <Input value={ttdJabatan} onChange={(e) => setTtdJabatan(e.target.value)} aria-label="Jabatan penanda tangan" />
      </div>
      <Toolbar className="mt-3">
        <span className="text-xs text-muted">{countText}</span>
        <Button variant="export" onClick={onDownloadCsv} className="ml-auto">
          <Download size={14} />
          {csvLabel}
        </Button>
        <Button variant="ghost" onClick={onCopySummary}>
          Salin ringkasan
        </Button>
        <Button variant="primary" onClick={() => window.print()}>
          <Printer size={14} />
          Cetak / Simpan PDF
        </Button>
      </Toolbar>
    </SectionCard>
  );
}
