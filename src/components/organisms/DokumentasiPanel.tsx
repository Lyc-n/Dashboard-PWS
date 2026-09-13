import type { ReactNode } from "react";
import type { Foto } from "@/lib/use-kegiatan";
import { DocCard } from "@/components/molecules/DocCard";
import { DropZone } from "@/components/molecules/DropZone";

export interface DokumentasiPanelProps {
  fotos: Foto[];
  onAddFiles: (files: File[]) => void;
  onSetCaption: (index: number, caption: string) => void;
  onRemoveFoto: (index: number) => void;
  title?: ReactNode;
}

export function DokumentasiPanel({
  fotos,
  onAddFiles,
  onSetCaption,
  onRemoveFoto,
  title = `Dokumentasi Kegiatan (${fotos.length}/6)`,
}: DokumentasiPanelProps) {
  return (
    <div className="rounded-[10px] border border-line bg-surface p-3.5">
      <b className="text-[13px] text-ink">{title}</b>
      <DropZone onFiles={onAddFiles} title="Klik untuk pilih foto" hint="JPG / PNG · min. 3 foto · maks. 6 · maks. 2 MB" />
      {fotos.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {fotos.map((f, i) => (
            <DocCard
              key={`${f.url}-${i}`}
              src={f.url}
              caption={f.cap}
              index={i}
              onChangeCaption={(v) => onSetCaption(i, v)}
              onDelete={() => onRemoveFoto(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default DokumentasiPanel;