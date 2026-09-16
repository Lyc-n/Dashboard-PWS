import { useId } from "react";

export interface DropZoneProps {
  onFiles?: (files: File[]) => void;
  title?: string;
  hint?: string;
}

export function DropZone({ onFiles, title = "Klik untuk pilih foto", hint = "JPG / PNG dari galeri atau kamera · bisa pilih banyak sekaligus" }: DropZoneProps) {
  const id = useId();
  return (
    <>
      <label
        htmlFor={id}
        className="mt-3 block cursor-pointer rounded-[10px] border-[1.5px] border-dashed border-accent-border bg-[var(--color-surface)] p-4 text-center transition-colors hover:border-accent"
      >
        <b className="text-[13px] text-accent">{title}</b>
        {hint ? <p className="mt-1 text-[11.5px] text-muted">{hint}</p> : null}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          onFiles?.(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </>
  );
}
