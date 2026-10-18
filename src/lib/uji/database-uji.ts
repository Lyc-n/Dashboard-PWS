/**
 * Penjaga "skrip ini hanya boleh menunjuk database uji".
 *
 * Kenapa modul ini ada: sebelumnya masih ada tiga salinan identik
 * (`smoke-kunjungan-rumah.mts`, `smoke-kegiatan.mts`, dan `seed-uji-coba.mts`).
 * Pengaman data yang butuh tiga salinan akan hilang begitu salah satu diedit dan
 * lupa memperbarui yang lain — skrip yang tersisa tetap terlihat aman padahal
 * sudah tidak terlindungi. Sekarang hanya ada satu definisi.
 *
 * Yang TIDAK diubah dari versi sebelumnya: pola pencocokan tetap sama persis.
 * Restriktifnya dan celahnya sengaja dibiarkan apa adanya supaya tidak memutus
 * pemakaian yang sudah berjalan. Perlu baca catatan {@link CATATAN_RESIKO} dulu
 * sebelumissiveDB diubah nama penandanya.
 */

/**
 * Penanda yang membuat sebuah URL dianggap milik database uji.
 *
 * Dicocokkan terhadap SELURUH URL sekaligus nama database, jadi `localhost` di
 * bagian host tetap terdeteksi walaupun nama database-nya biasa saja.
 *
 * Sengaja longgar: pola ini menyaring kesalahan-kesalahan yang paling sering
 * terjadi, bukan menjerat setiap kemungkinan. Lihat {@link CATATAN_RESIKO}.
 */
export const NAMA_DB_DIIZINKAN =
  /(uji|trial|test|staging|dev|localhost|127\.0\.0\.1)/i

/**
 * Batas yang diketahui dari {@link NAMA_DB_DIIZINKAN}, disengaja dan belum
 * ditutup:
 *
 *   - Pencocokan berupa substring pada seluruh URL, jadi database produksi
 *     bernama `pws_dev_backup` atau `staging_lama` ikut lolos.
 *   - Database uji yang namanya tidak mengandung satu pun penanda akan ditolak
 *     walau lokal. Ikuti saja aturan di depan, atau setel nama database uji
 *     supaya memuat `uji`.
 *
 * Menutup celah pertama berarti memakai daftar putih per lingkungan, yang harus
 * diisi manual di tiap mesin — hambatan yang lebih besar daripada risikonya
 * untuk repo ini. Kalau suatu saat skrip uji dipakai pada data produksi sungguhan,
 * pola ini harus diganti, bukan hanya diperketat.
 */
export const CATATAN_RESIKO =
  'Pola nama database uji masih longgar: cocok pada substring, jadi nama ' +
  "mengandung 'dev' atau 'staging' pun dianggap aman."

/**
 * Pastikan `DATABASE_URL` menunjuk database uji, atau lempar error.
 *
 * Selalu panggil sebelum menulis apa pun. Fungsi ini hanya membaca
 * environment dan tidak membuka koneksi, jadi murah dipanggil di awal skrip.
 *
 * @param konteks Nama kegiatan pada pesan error, misalnya "smoke test" atau
 *   "seed". Boleh kosong; pesan tetap menyebut aturan dan cara memperbaikinya.
 * @returns Nama database yang terdeteksi, untuk dicetak di log.
 */
export function pastikanDatabaseUji(konteks = 'skrip ini'): string {
  const url = process.env.DATABASE_URL ?? ''
  if (!url) throw new Error('DATABASE_URL belum diisi.')

  const nama = (() => {
    try {
      return new URL(url).pathname.replace(/^\//, '')
    } catch {
      return ''
    }
  })()

  if (!NAMA_DB_DIIZINKAN.test(`${url} ${nama}`)) {
    throw new Error(
      `Database "${nama || 'tidak dikenal'}" bukan database uji. ` +
        `Set DATABASE_URL ke database uji sebelum menjalankan ${konteks}.`,
    )
  }

  console.log(`Database uji: ${nama}`)
  return nama
}
