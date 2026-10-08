/**
 * Entry point `pnpm db:seed`.
 *
 * Dua langkah, sengaja dipisah karena aturannya berbeda:
 *   1. `seedReferenceData()` - wilayah kerja, fasilitas kesehatan, pengguna
 *      awal. Isi kalau belum ada, tidak pernah menimpa data yang sudah ada.
 *   2. `seedFormDefaults()` - dua form bawaan. Berhenti kalau `forms.kode`
 *      sudah ada, supaya edit admin di Form Builder tidak hilang.
 *
 * Urutannya penting: `users.fasKesId` menunjuk `fasilitas_kesehatan`, jadi
 * langkah 1 harus selesai sebelum ada yang bisa membuat akun.
 */
import 'dotenv/config'
import { seedFormDefaults } from './seed-form-defaults'
import { seedReferenceData } from './seed-reference'

function cetak(label: string, items: string[]): void {
  if (items.length === 0) return
  console.log(`  + ${label}: ${items.join(', ')}`)
}

async function main(): Promise<void> {
  const ref = await seedReferenceData()
  console.log('Data referensi:')
  cetak('wilayah kerja', ref.wilayahBaru)
  cetak('fasilitas', ref.fasilitasBaru)
  cetak('pengguna', ref.penggunaBaru)
  if (ref.dilewati.length > 0) {
    console.log(
      `  ℹ️  Sudah ada, tidak disentuh (${ref.dilewati.length}): ${ref.dilewati.join(', ')}`,
    )
  }

  const laporan = await seedFormDefaults()
  console.log('Form bawaan:')
  for (const baris of laporan) {
    if (baris.dibuat) {
      console.log(`  ✅ "${baris.kode}" dibuat pada versi ${baris.versi}.`)
    } else {
      console.log(
        `  ℹ️  "${baris.kode}" sudah ada. Definisi tidak disentuh, jadi perubahan admin di Form Builder tetap utuh.`,
      )
    }
  }
}

main()
  .catch((error) => {
    console.error('❌ Seeder gagal:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
