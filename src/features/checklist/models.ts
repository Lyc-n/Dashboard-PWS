import type { SasaranKey } from "@/lib/kr-form";

// Single source untuk model domain checklist.
// Dipindah dari hooks/use-kunjungan (hook dihapus, tipe tetap di sini).

export interface AnggotaKeluarga {
  id: string;
  nama: string;
  nik: string;
  tglLahir: string;
  jk: string;
  hubKK: string;
  statusKawin: string;
  pendidikan: string;
  pekerjaan: string;
  [key: string]: string;
}

export interface PenilaianForm {
  id: string;
  anggotaId: string;
  sasaran: SasaranKey;
  values: Record<string, string>;
  checks: Record<string, boolean>;
  prioritas: string[];
}

export interface MasalahTindak {
  id: string;
  nama: string;
  nik: string;
  tglLahir: string;
  alamat: string;
  telepon: string;
  masalah: string;
  tindakLanjut: string;
  [key: string]: string;
}

export interface KeluargaInfo {
  tglPengumpulan: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kabKota: string;
  provinsi: string;
  hpKK: string;
  puskesmas: string;
  pustu: string;
  posyandu: string;
  namaKK: string;
  [key: string]: string;
}

export interface Sanitasi {
  jkn: boolean;
  airBersih: boolean;
  jenisAir: string;
  jamban: boolean;
  jambanSaniter: string;
  jenisSumberAir: string;
  ventilasi: boolean;
  odgj: boolean;
  tbc: boolean;
  hipertensi: boolean;
  dm: boolean;
  [key: string]: boolean | string;
}

export interface KunjunganFormState {
  info: KeluargaInfo;
  sanitasi: Sanitasi;
  anggota: AnggotaKeluarga[];
  penilaian: PenilaianForm[];
  masalah: MasalahTindak[];
  hasil: string;
  jadwal: string;
  ttd: string;
}

/** Baca field string dinamis tanpa `as unknown` di call-site. */
export function strField(rec: Record<string, string>, id: string): string {
  return rec[id] ?? "";
}

/** Baca field sanitasi (boolean|string) tanpa cast di call-site. */
export function sanField(rec: Sanitasi, id: string): boolean | string | undefined {
  return rec[id];
}
