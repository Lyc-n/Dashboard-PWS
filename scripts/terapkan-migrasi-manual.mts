/**
 * Terapkan file SQL dari drizzle/manual ke DATABASE_URL.
 *
 * Tidak ada psql maupun pg_restore di PATH mesin ini, dan drizzle-kit tidak bisa
 * menjalankan file manual (file itu hidup di luar journal-nya). Jadi satu-satunya
 * jalur adalah client `postgres` yang sudah dipakai aplikasi.
 *
 * Skrip ini HANYA menjalankan file yang diberikan, apa adanya: tidak ada patch,
 * tidak ada drop, tidak ada rename, tidak ada truncate. Semua statement satu
 * file dijalankan dalam SATU transaksi lewat `sql.begin()`, jadi kalau satu
 * statement gagal, seluruh file dibatalkan — tidak ada yang jalan separuh.
 *
 * Pakai:
 *   npx tsx scripts/terapkan-migrasi-manual.mts drizzle/manual/foo.sql
 *   npx tsx scripts/terapkan-migrasi-manual.mts --dry-run drizzle/manual/foo.sql
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileArgs = args.filter((a) => a !== "--dry-run");

if (fileArgs.length === 0) {
  console.error("Tanpa file: npx tsx scripts/terapkan-migrasi-manual.mts [--dry-run] <file1.sql> [file2.sql ...]");
  process.exit(1);
}

const connectionUrl = process.env.DATABASE_URL;
if (!connectionUrl) {
  console.error("DATABASE_URL belum diisi. Skrip ini tidak boleh menebak database mana yang dituju.");
  process.exit(1);
}

/** Postgres.js menolak BEGIN TRANSACTION eksplisit di dalam kueri multi-
 *  statement (UNSAFE_TRANSACTION), dan file manual yang menulis
 *  `begin; ... commit;` sendiri membuat statement bisa diterapkan sebagian
 *  tanpa rollback kalau satu statement gagal.
 *
 *  Tantangannya: kata `begin` juga keyword plpgsql yang sah DI DALAM blok
 *  `do $$ ... $$`. Maka pemeriksaannya memisahkan bagian luar dan dalam blok
 *  dollar-quoted dengan menomor satu-satu batas `$$`, lalu hanya bagian luar
 *  yang dipindai. Ini menganggap file memakai dollar-quote tanpa tag ($tag$) —
 *  seluruh file manual di repo ini memang begitu.
 */
function bagianLuarDollarQuote(text: string): string {
  const bagian: string[] = [];
  let dalam = false;
  for (const potong of text.split("$$")) {
    if (!dalam) bagian.push(potong);
    dalam = !dalam;
  }
  return bagian.join("\n");
}

/** Buang komentar SQL (baris -- dan blok slash-star). Kata `begin` yang hanya
 *  disebut di penjelasan tidak boleh ikut menyalakan penolakan. */
function tanpaKomentar(text: string): string {
  return text.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
}

function tanpaTransactionSendiri(fileArg: string, text: string): void {
  const aktif = tanpaKomentar(bagianLuarDollarQuote(text));
  const masalah = ["begin", "commit", "rollback"].filter((kata) =>
    new RegExp(`(^|[^a-zA-Z])${kata}\\b`, "i").test(aktif),
  );
  if (masalah.length > 0) {
    console.error(`\n  DITOLAK: ${fileArg} memakai perintah transaction ${masalah.join(" dan ")} sendiri.`);
    console.error("  Transaksi dimiliki runner ini (sql.begin), bukan file SQL.");
    console.error("  Kalau file dijalankan gagal di tengah, Postgres harus membatalkan semuanya,");
    console.error("  bukan hanya statement yang sempat jalan.");
    console.error("  Hapus BEGIN/COMMIT tingkat atas dari file (bukan dari dalam blok do $$), lalu jalankan lagi.");
    process.exit(1);
  }
}

/** Supaya database yang dipakai lewat pooler tidak salah ditempeli. */
function labelDb(url: string): string {
  try {
    const u = new URL(url);
    const nama = u.pathname.replace(/^\//, "");
    return `${u.hostname} / ${nama || "(tanpa nama)"}`;
  } catch {
    return "(URL tidak biasa)";
  }
}

const sql = postgres(connectionUrl, { prepare: false });

console.log(`DATABASE_URL -> ${labelDb(connectionUrl)}`);

/** Daftar tabel, untuk membandingkan sebelum/di setelah supaya laporan
 *  "tabel baru" tidak bergantung pada log yang mungkin tidak terbaca. */
async function daftarTabel(): Promise<string[]> {
  const rows = await sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
  return rows.map((r: any) => r.table_name);
}

const sebelum = await daftarTabel();
console.log(`Sebelum: ${sebelum.length} tabel.`);

for (const fileArg of fileArgs) {
  const file = resolve(fileArg);
  const text = readFileSync(file, "utf8");
  const baris = text.split("\n").filter((l) => l.trim()).length;

  tanpaTransactionSendiri(fileArg, text);

  if (dryRun) {
    console.log(`\n[dry-run] ${fileArg} (# ${baris} baris SQL di file). Tidak ada yang dijalankan.`);
    console.log("--- isi ---");
    console.log(text);
    continue;
  }

  console.log(`\nTerapkan ${fileArg} (# ${baris} baris SQL)`);
  try {
    // Satu transaksi untuk satu file. Kalau statement mana pun gagal,
    // seluruh file dibatalkan — tidak ada yang jalan separuh.
    await sql.begin(async (tx) => {
      await tx.unsafe(text);
    });
    console.log("  OK: seluruh statement di file ini dijalankan dalam satu transaksi.");
  } catch (err) {
    console.error("\n  GAGAL. Semua statement file ini dibatalkan oleh sql.begin (rollback).");
    console.error(`  Istilah error: ${err instanceof Error ? err.message : String(err)}`);
    break;
  }
}

// Perubahan dicetak di sini juga setelah file gagal, supaya laporan ini
// menunjukkan apa yang PERSIS terjadi di database, bukan perkiraan.
if (!dryRun) {
  const sesudah = await daftarTabel();
  const baru = sesudah.filter((t) => !sebelum.includes(t));
  console.log(`\nSesudah: ${sesudah.length} tabel.`);
  console.log(`Tabel baru: ${baru.length === 0 ? "(tidak ada)" : baru.join(", ")}`);
}

await sql.end();
process.exit(process.exitCode ?? 0);