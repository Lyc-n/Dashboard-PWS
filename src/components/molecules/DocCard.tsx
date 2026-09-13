import { Button } from "@/components/atoms/Button";

export interface DocCardProps {
  src: string;
  caption: string;
  index: number;
  onChangeCaption?: (caption: string) => void;
  onDelete?: () => void;
}

export function DocCard({ src, caption, index, onChangeCaption, onDelete }: DocCardProps) {
  return (
    <div className="grid overflow-hidden rounded-[10px] border border-line bg-surface">
      <img src={src} alt={`Dokumentasi kegiatan ${index + 1}`} className="block h-[150px] w-full bg-line-2 object-cover" />
      <div className="grid gap-2 p-2.5">
        <input
          value={caption}
          placeholder={`Keterangan foto ${index + 1}… (cth. Pembukaan)`}
          onChange={(e) => onChangeCaption?.(e.target.value)}
          className="w-full rounded-lg border border-line px-2.5 py-2 text-xs text-ink outline-none placeholder:text-[var(--color-muted-soft)]"
        />
        <Button size="sm" variant="danger" onClick={onDelete}>
          Hapus foto
        </Button>
      </div>
    </div>
  );
}

export default DocCard;