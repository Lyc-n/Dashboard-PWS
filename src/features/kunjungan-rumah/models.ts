import type { SasaranKey } from "@/lib/kunjungan-rumah-form";

// Sumber tunggal untuk model domain kunjungan rumah.
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
  /** Ikat ke anggota keluarga lewat id, bukan nama — aman untuk nama kembar. */
  anggotaId?: string;
  nama: string;
  nik: string;
  tglLahir: string;
  alamat: string;
  telepon: string;
  masalah: string;
  tindakLanjut: string;
  [key: string]: string | undefined;
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
  // [perbaikan] atribusi petugas eksplisit — expect: ikut tersimpan di record.info,
  //   lalu dipetakan ke surveys.petugasId (uuid FK surveyor) saat sinkron ke DB nanti.
  petugasId: string;
  petugasNama: string;
  [key: string]: string;
}

export interface Sanitasi {
  jkn: boolean;
  jenisAir: string;
  jambanSaniter: string;
  ventilasi: boolean;
  odgj: boolean;
  tbc: boolean;
  hipertensi: boolean;
  dm: boolean;
  [key: string]: boolean | string;
}

/** Satu foto dokumentasi kunjungan. fileUrl = Supabase Storage (publik); dataUrl lawas opsional. */
export interface KunjunganRumahFoto {
  id: string;
  name: string;
  /** URL publik Supabase Storage — diisi saat submit setelah upload. */
  fileUrl?: string;
  /** Base64 lawas (data localStorage) — hanya untuk pratinjau sebelum upload / fallback baca lama. */
  dataUrl?: string;
  caption: string;
  takenAt: string;
}

/** Baca field sanitasi (boolean|string) tanpa cast di lokasi pemanggil. */
export function sanField(rec: Sanitasi, id: string): boolean | string | undefined {
  return rec[id];
}
