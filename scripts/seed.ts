import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/lib/db.server";
import { dataWargaTable, forms, surveyor } from "../src/lib/schema";
import { seedAdminStaff } from "../src/lib/seeds";
// Awal seed warga. Disalin dari dataset awal agar scripts/seed.ts mandiri
// (tidak ada lagi impor data demo dari src).
const SASARAN_SEED: { nama: string; nik: string; kel: string; prior: string }[] = [
  { nama: "Ny. Siti Aminah", nik: "3573014203820001", kel: "Trajeng", prior: "Bumil Risti" },
  { nama: "An. Rafi Ahmad", nik: "3573011201240002", kel: "Ngemplakrejo", prior: "Stunting" },
  { nama: "Tn. Slamet Riyadi", nik: "3573011505800003", kel: "Tambaan", prior: "TB" },
  { nama: "Tn. Wahyu Hidayat", nik: "3573011009850004", kel: "Trajeng", prior: "ODGJ" },
  { nama: "An. Kirana Putri", nik: "3573012208250005", kel: "Mayangan", prior: "Balita Risti" },
  { nama: "Ny. Lestari Dewi", nik: "3573014802900006", kel: "Ngemplakrejo", prior: "Bumil Risti" },
  { nama: "Ny. Mariyah", nik: "3573015509700007", kel: "Tambaan", prior: "ODGJ" },
  { nama: "An. Bagas Pratama", nik: "3573011803240008", kel: "Mayangan", prior: "Balita Risti" },
  { nama: "An. Dinda Ayu", nik: "3573016408230009", kel: "Trajeng", prior: "Stunting" },
  { nama: "Ny. Yuni Astuti", nik: "3573016207900010", kel: "Mayangan", prior: "TB" },
];

function sasaranRows(): { nama: string; nik: string; kel: string; prior: string }[] {
  const rows = [...SASARAN_SEED];
  while (rows.length < 36) {
    const b = rows[rows.length % 10];
    if (!b) break;
    rows.push({ ...b, nik: b.nik.slice(0, 12) + (1000 + rows.length), nama: `${b.nama} #${rows.length}` });
  }
  return rows;
}

const FORM_NAMA = "Formulir KR PWS";

// gender dari nama (Ny./Tn.) atau digit ke-7 NIK (ganjil = laki-laki) — expect: kolom enum terisi valid.
function jenisKelamin(nik: string, nama: string): "laki-laki" | "perempuan" {
  if (nama.startsWith("Ny.")) return "perempuan";
  if (nama.startsWith("Tn.")) return "laki-laki";
  return Number(nik[6]) % 2 === 1 ? "laki-laki" : "perempuan";
}

function hubungan(nama: string): "Anak" | "Istri" | "Kepala Keluarga" {
  if (nama.startsWith("An.")) return "Anak";
  if (nama.startsWith("Ny.")) return "Istri";
  return "Kepala Keluarga";
}

async function seedSurveyor() {
  const staff = seedAdminStaff();
  const namaSemua = staff.map((s) => s.nama);
  // hapus dulu baris dengan nama yang sama 
  await db.delete(surveyor).where(inArray(surveyor.nama, namaSemua));
  await db.insert(surveyor).values(staff.map((s) => ({ nama: s.nama })));
  console.log(`surveyor: ${staff.length} baris`);
}

async function seedWarga() {
  const rows = sasaranRows().map((r, i): typeof dataWargaTable.$inferInsert => {
    const anak = r.nama.startsWith("An.");
    return {
      nik: r.nik,
      nama_art: r.nama,
      nama_kk: r.nama.replace(/^(Ny\.|Tn\.|An\.)\s*/, ""),
      hubungan_keluarga: hubungan(r.nama),
      alamat: `Jl. ${r.kel} No. ${i + 1}`,
      tgl_lahir: anak ? "2024-01-10" : "1990-05-15",
      rt: (i % 8) + 1,
      rw: (i % 4) + 1,
      kecamatan: "Gadingrejo",
      kelurahan: r.kel,
      kota: "Kota Pasuruan",
      status_kawin: anak ? "belum kawin" : "kawin",
      petugas: "Kader PWS",
      jenis_kelamin: jenisKelamin(r.nik, r.nama),
      wanita_usia_hamil: r.prior === "Bumil Risti",
      agama: "Islam",
      pendidikan: anak ? "Belum Tamat SD/Sederajat" : "SLTA/Sederajat",
      pekerjaan: anak ? "Pelajar" : "Ibu rumah tangga",
    };
  });
  await db.insert(dataWargaTable).values(rows).onConflictDoNothing({ target: dataWargaTable.nik }); // nik = pk
  console.log(`data_warga: ${rows.length} baris`);
}

async function seedForm() {
  await db.delete(forms).where(eq(forms.nama, FORM_NAMA));
  await db.insert(forms).values({
    nama: FORM_NAMA,
    deskripsi: "Formulir kerja rumah PWS (data seed)",
  });
  console.log(`forms: 1 baris (${FORM_NAMA})`);
}

async function main() {
  await seedSurveyor();
  await seedWarga();
  await seedForm();
  console.log("seed selesai");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("seed gagal:", err);
    process.exit(1);
  });
