/**
 * Terjemahkan baris `riwayat_ks_import` jadi isian section Sanitasi.
 *
 * Hanya 7 dari 8 field Sanitasi punya pasangan kolom di tabel riwayat. Dua sisanya
 * (`ventilasi`, `dm`) tidak punya kolom apa pun dan tidak disentuh di sini.
 *
 * Prinsipnya: nilai yang ada di daftar opsi field dipakai, yang tidak ada
 * dibiarkan kosong. Daftar opsi field terkunci di `src/lib/kunjungan-rumah-templates.ts`
 * dan tidak boleh berubah, sedangkan isi tabel riwayat berasal dari impor
 * eksternal yang tidak bisa diprediksi dari repo. Jadi nilai tak dikenal berarti
 * select akan menampilkan kosong — lebih baik daripada menampilkan opsi yang
 * berbeda dari data aslinya.
 *
 * Field `checkbox` (boolean) punya masalah sebaliknya. Kolom riwayat nullable:
 * `null` berarti "tidak diperiksa", bukan "tidak ada". Menulis `false` untuk
 * `null` akan menyatakan hal yang tidak diketahui, jadi `null` dibiarkan apa
 * adanya dan checkbox tetap tidak tercentang.
 *
 * Modul ini murni: tidak menyentuh database maupun network, supaya pemetaannya
 * bisa diuji tanpa environment.
 */
import type { Sanitasi } from '@/features/kunjungan-rumah/models'

/** Field Sanitasi yang berasal dari checkbox, bukan select. */
const DARI_CHECKBOX = [
  { field: 'jkn', kolom: 'kepesertaanJkn' },
  { field: 'odgj', kolom: 'diagnosisOdgj' },
  { field: 'tbc', kolom: 'diagnosisTbParu' },
  { field: 'hipertensi', kolom: 'diagnosisHipertensi' },
] as const

/**
 * Peta nilai teks dari `riwayat_ks_import` ke opsi select Sanitasi.
 *
 * Kunci adalah nilai yang mungkin ada di tabel impor, ditulis dalam bentuk
 * lowercase tanpa spasi supaya perbandingan tidak bergantung pada kapitalisasi
 * dan spasi ganda. Nilai yang tidak ada di peta ini menghasilkan `''`.
 *
 * Kata kunci `Lainnya` untuk air diakses lewat penanda eksplisit, bukan
 * `startsWith`, supaya "AirPipeline" tidak ikut terpetakan ke "Lainnya".
 */
const KUNCI_NILAI = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ')

const PETA_JAMBAN: Record<string, string> = {
  kloset: 'Kloset',
  closet: 'Kloset',
  'water closet': 'Kloset',
  wc: 'Kloset',
  'leher angsa': 'Leher angsa',
  'leher angsa/flushing': 'Leher angsa',
  plengseran: 'Plengseran',
  'plengseran/terang': 'Plengseran',
  cemplung: 'Cemplung',
}

const PETA_AIR: Record<string, string> = {
  'sumur terlindung': 'Sumur terlindung',
  'sumur terlindung/tertutup': 'Sumur terlindung',
  sumur: 'Sumur terlindung',
  'ledeng/pdam': 'Ledeng/PDAM',
  pdam: 'Ledeng/PDAM',
  ledeng: 'Ledeng/PDAM',
  'sumur pompa': 'Sumur pompa',
  pompa: 'Sumur pompa',
  'sumur pompa/tertutup': 'Sumur pompa',
  'mata air terlindung': 'Mata air terlindung',
  'mata air': 'Mata air terlindung',
  'sumur terbuka': 'Sumur terbuka',
  'air sungai': 'Air sungai',
  sungai: 'Air sungai',
  'danau / telaga': 'Danau / telaga',
  danau: 'Danau / telaga',
  telaga: 'Danau / telaga',
  lainnya: 'Lainnya',
  lain: 'Lainnya',
}

/**
 * Isian awal Sanitasi dari satu baris riwayat.
 *
 * Mengembalikan `null` kalau baris riwayat tidak ada (warga belum pernah
 * diperiksa), supaya pemanggil bisa membiarkan isian yang sudah ada apa adanya.
 * Kalau baris ada, field yang tidak punya pasangan kolom maupun yang bernilai
 * `null` juga tidak ikut, dan `sanitasi` yang sudah terisi di form ikut
 * ditimpa — sesuai keputusan: riwayat yang ada menang atas isian manual.
 */
export function sanitasiDariRiwayat(
  ada: boolean,
  nilai: Record<string, unknown>,
  sekarang: Sanitasi,
): Sanitasi | null {
  if (!ada) return null

  const hasil: Sanitasi = { ...sekarang }
  let berubah = false

  for (const { field, kolom } of DARI_CHECKBOX) {
    const v = nilai[kolom]
    // `null` = tidak diperiksa. `Boolean(null)` yang salah akan menyatakan
    // "tidak ada" untuk hal yang tidak diketahui.
    if (typeof v !== 'boolean') continue
    hasil[field] = v
    berubah = true
  }

  const jamban = nilai.jenisJambanSaniter
  if (typeof jamban === 'string') {
    hasil.jambanSaniter = PETA_JAMBAN[KUNCI_NILAI(jamban)] ?? ''
    berubah = true
  }

  const air = nilai.jenisSumberAirTerlindung
  if (typeof air === 'string') {
    hasil.jenisAir = PETA_AIR[KUNCI_NILAI(air)] ?? ''
    berubah = true
  }

  return berubah ? hasil : null
}
