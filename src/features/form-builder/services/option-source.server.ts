/**
 * Resolver sumber opsi dinamis untuk Form Builder.
 *
 * Sebagian field tidak menyimpan pilihan jawabannya di `form_field_rules`,
 * melainkan menunjuk ke tabel lain lewat `form_fields.optionSourceType` /
 * `optionSourceKey`. Contohnya field "Petugas" di Form Kegiatan Pemberdayaan,
 * yang opsinya adalah akun `users` yang aktif dan berperan staff atau kader.
 *
 * Kenapa begini, bukan menyimpan pilihan jawaban di `form_field_rules`:
 * daftar petugas berubah setiap kali admin menambah atau menonaktifkan akun di
 * /kelola. Kalau opsinya ikut disimpan, setiap perubahan akun ikut mengubah isi
 * form, dan form yang sudah pernah diisi jadi tidak konsisten dengan yang
 * dicatat petugas. Dengan menunjuk ke `users`, opsinya selalu mengikuti data
 * terbaru, dan submission lama tetap menyimpan `users.id` yang benar.
 *
 * CATATAN JUJUR SOAL BATASNYA: resolver ini mengembalikan pilihan berdasarkan
 * state `users` saat form dirender atau disimpan. Kalau seorang petugas
 * dinonaktifkan setelah form dibuka tapi sebelum dikirim, pilihannya bisa saja
 * sudah tidak berlaku. `pastikanPetugasValid()` menutup celah itu di sisi
 * server, jadi form yang terlanjur terbuka tidak bisa menyimpan petugas yang
 * sudah dinonaktifkan.
 */
import { listPetugasOpsi } from "@/lib/user-registry.server";

export interface OpsiDinamis {
  /** Nilai yang disimpan di `survey_entries.value`. Untuk petugas ini `users.id`. */
  value: string;
  /** Teks yang dilihat petugas. */
  label: string;
}

export interface HasilResolverOpsi {
  opsi: OpsiDinamis[];
  /**
   * true kalau sumbernya tidak dikenali ATAU hasilnya kosong. UI bisa
   * menampilkan peringatan supaya masalah konfigurasi field terlihat, bukan
   * muncul sebagai dropdown kosong yang membingungkan.
   */
  sumberTidakDikenali: boolean;
}

/**
 * Ambil pilihan untuk satu field.
 *
 * `optionSourceType` null atau kosong berarti field ini memakai opsi statis dari
 * `form_field_rules`; hasilnya kosong dan pemanggil harus pakai baris
 * `form_field_rules`, bukan hasil fungsi ini.
 *
 * `fasKesId` membatasi pilihan ke satu fasilitas. null berarti semua fasilitas,
 * dan itu dipakai ketika pemanggil tidak tahu fasilitas mana yang relevan —
 * misalnya sesi login masih memakai PIN global sehingga tidak ada `users.id`
 * yang diketahui (lihat `useKaderAktif`).
 */
export async function resolveOpsiDinamis(params: {
  optionSourceType: string | null | undefined;
  optionSourceKey?: string | null;
  fasKesId?: number | null;
}): Promise<HasilResolverOpsi> {
  const { optionSourceType, fasKesId } = params;
  if (!optionSourceType) return { opsi: [], sumberTidakDikenali: false };

  if (optionSourceType !== "users") {
    return { opsi: [], sumberTidakDikenali: true };
  }

  const petugas = await listPetugasOpsi(fasKesId ?? null);
  return {
    opsi: petugas.map((p) => ({ value: p.id, label: `${p.nama} — ${p.fasKes}` })),
    sumberTidakDikenali: petugas.length === 0,
  };
}
