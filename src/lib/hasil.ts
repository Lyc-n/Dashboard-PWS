export type HasilKind = "selesai" | "jadwal" | "rujuk";

/** Kategorikan hasil kunjungan rumah dari label opsi, tanpa bergantung urutan array (tahan terhadap perubahan urutan opsi oleh admin). */
export function hasilKind(h: string): HasilKind {
  const t = h.toLowerCase();
  if (t.includes("rujuk")) return "rujuk";
  if (t.includes("ulang") || t.includes("kontrol")) return "jadwal";
  return "selesai";
}

export const HASIL_KIND_LABEL: Record<HasilKind, string> = {
  selesai: "Tidak ada masalah berarti",
  jadwal: "Butuh jadwal ulang",
  rujuk: "Butuh rujukan",
};