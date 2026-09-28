/**
 * Masking NIK untuk jejak audit.
 *
 * NIK adalah data pribadi yang terikat lebih kuat dari data lain, jadi tidak
 * boleh masuk log atau tabel audit dalam bentuk mentah. Empat digit depan
 * (kode provinsi + kab/kota + kecamatan awal) dan empat digit belakang
 * (nomor urut) disimpan supaya jejak tetap bisa dikaitkan tanpa membocorkan
 * identitas lengkap.
 */
export function maskNik(nik: string): string {
  const bersih = nik.trim()
  if (bersih.length < 8) return '*'.repeat(Math.max(bersih.length, 4))
  return `${bersih.slice(0, 4)}****${bersih.slice(-4)}`
}
