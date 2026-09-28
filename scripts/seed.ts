/**
 * Entry point `pnpm db:seed`.
 *
 * Definisi form ada di `scripts/seed-form-defaults.ts`. File ini hanya
 * memanggilnya lalu mencetak laporan, supaya mudah ditambah langkah seeding
 * lain (mis. wilayah kerja dan fasilitas kesehatan) tanpa menyentuh logika form.
 */
import "dotenv/config";
import { seedFormDefaults } from "./seed-form-defaults";

async function main(): Promise<void> {
  const laporan = await seedFormDefaults();

  for (const baris of laporan) {
    if (baris.dibuat) {
      console.log(`✅ Form "${baris.kode}" dibuat pada versi ${baris.versi}.`);
    } else {
      console.log(
        `ℹ️  Form "${baris.kode}" sudah ada. Definisi tidak disentuh, jadi perubahan admin di Form Builder tetap utuh.`,
      );
    }
  }
}

main()
  .catch((error) => {
    console.error("❌ Seeder gagal:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
