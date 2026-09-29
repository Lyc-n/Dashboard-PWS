/**
 * Uji asap (smoke test) jalur simpan kegiatan v2 terhadap database uji.
 *
 * Ini BUKAN bagian dari `pnpm db:seed` dan tidak ikut `vitest run`. Tujuannya
 * memeriksa hal yang tidak bisa dibuktikan unit test: bahwa UUID `users` benar
 * bisa masuk ke `surveys.petugasId`, nama field-petugas benar-benar cocok dengan
 * yang ditulis migration, dan opsinya benar-benar ter-resolve dari `users`.
 *
 * Semua yang dibuat file ini DIHAPUS di akhir, jadi database kembali seperti
 * sebelum dijalankan. Kalau ada langkah yang gagal sebelum cleanup, cari submission
 * kegiatan sisa dengan `surveys.formVersionId` = versi form kegiatan.
 *
 * Hanya database uji yang diterima. Jalankan dengan override eksplisit,
 * misalnya:
 *
 *     DATABASE_URL="postgresql://.../dashboard_pws_uji_schema" \
 *       pnpm db:smoke-kegiatan
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db.server";
import { surveys } from "@/lib/schema/schema";
import { simpanKegiatan, listKegiatan } from "@/features/survey/services/kegiatan.server";
import { listPetugasOpsi } from "@/lib/user-registry.server";
import { querySurveyStatsByNik } from "@/lib/utils.server";
import { resolveOpsiDinamis } from "@/features/form-builder/services/option-source.server";

const NAMA_DB_DIIZINKAN = /(uji|trial|test|staging|dev|localhost|127\.0\.0\.1)/i;

function pastikanDatabaseUji(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) throw new Error("DATABASE_URL belum diisi.");
  const nama = (() => {
    try {
      return new URL(url).pathname.replace(/^\//, "");
    } catch {
      return "";
    }
  })();
  if (!NAMA_DB_DIIZINKAN.test(`${url} ${nama}`)) {
    throw new Error(
      `Database "${nama || "tidak dikenal"}" bukan database uji. ` +
        "Set DATABASE_URL ke database uji sebelum menjalankan smoke test ini.",
    );
  }
  console.log(`Database uji: ${nama}`);
}

async function main(): Promise<void> {
  pastikanDatabaseUji();
  const petugas = await listPetugasOpsi(null);
  console.log(`Petugas aktif yang bisa dipilih: ${petugas.length}`);
  for (const p of petugas) console.log(`  - ${p.nama} (${p.fasKes}) id=${p.id}`);
  if (petugas.length === 0) throw new Error("Tidak ada petugas aktif; dropdown akan kosong.");

  const { opsi } = await resolveOpsiDinamis({ optionSourceType: "users" });
  console.log(`Opsi dinamis untuk field Petugas: ${opsi.length}`);

  const created: string[] = [];

  try {
    const row = await simpanKegiatan({
      nama: "Uji asap kegiatan",
      jenis: "Penyuluhan",
      petugas: petugas[0]!.id,
      tgl: "2026-09-28",
      jam: "09:00",
      lokasi: "Balai RW 01",
      kel: "Trajeng",
      posy: "Melati 1",
      target: "10 ibu",
      deskripsi: "Dibuat oleh smoke test.",
      hadir: 1,
      total: 2,
      foto: 0,
      peserta: [
        { nama: "Ibu Warsini", kel: "Trajeng", hadir: true },
        { nama: "Ibu Lastri", kel: "Trajeng", hadir: false },
      ],
    });
    created.push(row.id);
    console.log(`OK disimpan: id=${row.id} petugas=${row.petugas}`);

    const semua = await listKegiatan();
    const ketemu = semua.find((r) => r.id === row.id);
    if (!ketemu) throw new Error("Submission yang baru disimpan tidak muncul di listKegiatan().");
    console.log(
      `OK dibaca balik: nama="${ketemu.nama}" kel=${ketemu.kel} hadir=${ketemu.hadir}/${ketemu.total} ` +
        `peserta=${ketemu.peserta.length} petugas="${ketemu.petugas}" jam="${ketemu.jam}"`,
    );
    if (ketemu.peserta.length !== 2) throw new Error("Jumlah peserta tidak kembali utuh.");
    if (ketemu.hadir !== 1) throw new Error("Jumlah hadir tidak kembali utuh.");

    // Submission kegiatan tidak punya warga, jadi tidak boleh ikut terhitung
    // sebagai kunjungan rumah di statistik dashboard/sasaran.
    const statistik = await querySurveyStatsByNik();
    if (statistik.some((s) => (s.nik as unknown) === null)) {
      throw new Error("Statistik ikut menghitung submission kegiatan tanpa warga.");
    }
    console.log("OK statistik: kegiatan tanpa warga tidak ikut total kunjungan.");

    // ID petugas yang tidak dikenal harus ditolak, bukan diteruskan ke kolom
    // uuid dan ditolak Postgres dengan pesan yang tidak bisa dibaca petugas.
    const AGA_DIKETAHUI = "00000000-0000-0000-0000-000000000000";
    let pesanDitolak: string | null = null;
    try {
      const bocahan = await simpanKegiatan({
        nama: "Harus ditolak",
        jenis: "Posyandu",
        petugas: AGA_DIKETAHUI,
        tgl: "2026-09-28",
        jam: "10:00",
        lokasi: "X",
        kel: "Trajeng",
        target: "",
        posy: "",
        deskripsi: "",
        hadir: 0,
        total: 0,
        foto: 0,
        peserta: [],
      });
      created.push(bocahan.id);
    } catch (e) {
      pesanDitolak = e instanceof Error ? e.message : String(e);
    }
    if (pesanDitolak === null) {
      throw new Error(`ID petugas ngawur tersimpan; seharusnya ditolak. Sisa: ${created.at(-1)}`);
    }
    console.log(`OK ditolak seperti seharusnya: ${pesanDitolak}`);
  } finally {
    for (const id of created) {
      await db.delete(surveys).where(eq(surveys.id, id));
      console.log(`Dihapus sisa uji: ${id}`);
    }
  }
}

main()
  .then(() => {
    console.log("SMOKE TEST OK");
    process.exit(0);
  })
  .catch((e) => {
    console.error("SMOKE TEST GAGAL:", e);
    process.exit(1);
  });
