import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";

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
        <Input
          value={caption}
          placeholder={`Keterangan foto ${index + 1}… (cth. Pembukaan)`}
          onChange={(e) => onChangeCaption?.(e.target.value)}
          className="px-2.5 py-2 text-xs"
        />
        <Button size="sm" variant="danger" onClick={onDelete}>
          Hapus foto
        </Button>
      </div>
    </div>
  );
}
