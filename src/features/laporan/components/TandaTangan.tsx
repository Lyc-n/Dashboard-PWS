import { TODAY } from "./report-shared";

export interface TandaTanganProps {
  nama: string;
  jabatan: string;
  containerClassName?: string;
  boxClassName?: string;
  namaClassName?: string;
}

export function TandaTangan({
  nama,
  jabatan,
  containerClassName = "mt-6 grid justify-items-end",
  boxClassName = "text-center text-[11px]",
  namaClassName = "mt-9 font-semibold text-ink",
}: TandaTanganProps) {
  return (
    <div className={containerClassName}>
      <div className={boxClassName}>
        <div className="text-muted">Kota Pasuruan, {TODAY}</div>
        <div className={namaClassName}>{nama}</div>
        <div className="mt-0.5 text-muted">{jabatan}</div>
      </div>
    </div>
  );
}
