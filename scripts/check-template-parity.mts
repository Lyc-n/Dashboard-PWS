/**
 * Cek paritas: definisi form di database harus sama persis dengan template bawaan di kode.
 *
 * Ini penjaga antara `scripts/seed.ts` (yang tidak boleh import dari `src/`) dan
 * `src/lib/kunjungan-rumah-templates.ts`. Kalau constexpr atau konstanta di kode berubah
 * tapi seed tidak menyesuaikan, skrip ini gagal.
 *
 * Jalankan: `pnpm db:check-parity` (butuh DATABASE_URL)
 */
import "dotenv/config";
import { getKunjunganRumahTemplateRows } from "../src/lib/utils.server.ts";
import { templateFromRows } from "../src/features/kunjungan-rumah/lib/template-from-rows.ts";
import { createDefaultKunjunganRumahTemplates } from "../src/lib/kunjungan-rumah-templates.ts";
import type { KunjunganRumahTemplateField } from "../src/lib/kunjungan-rumah-templates.ts";
import { SASARAN_KEYS } from "../src/lib/kunjungan-rumah-form.ts";

const rows = await getKunjunganRumahTemplateRows();
if (!rows) {
  console.error("GAGAL: form kunjungan rumah tidak ada di database. Jalankan `pnpm db:seed`.");
  process.exit(1);
}

const dariDb = templateFromRows(rows);
const dariKode = createDefaultKunjunganRumahTemplates();

let beda = 0;
const lap = (m: string) => {
  beda += 1;
  if (beda <= 30) console.error("BEDA " + m);
};

const FIELD_KEYS = ["id", "label", "kind", "section", "sasaranKey", "required", "active", "order", "hint"] as const;

function bandingField(a: KunjunganRumahTemplateField, b: KunjunganRumahTemplateField, lokasi: string) {
  for (const k of FIELD_KEYS) {
    if ((a[k] ?? null) !== (b[k] ?? null)) {
      lap(`${lokasi}.${k} (id ${a.id}): DB "${a[k]}" vs kode "${b[k]}"`);
    }
  }
  if (JSON.stringify(a.options ?? null) !== JSON.stringify(b.options ?? null)) {
    lap(`${lokasi}.options (id ${a.id}): DB ${JSON.stringify(a.options)} vs kode ${JSON.stringify(b.options)}`);
  }
}

function bandingDaftar(a: KunjunganRumahTemplateField[], b: KunjunganRumahTemplateField[], lokasi: string) {
  if (a.length !== b.length) {
    lap(`${lokasi}: jumlah field DB ${a.length} vs kode ${b.length}`);
    return;
  }
  for (let i = 0; i < a.length; i++) bandingField(a[i]!, b[i]!, `${lokasi}[${i}]`);
}

bandingDaftar(dariDb.keluargaInfo, dariKode.keluargaInfo, "keluargaInfo");
bandingDaftar(dariDb.anggota, dariKode.anggota, "anggota");
bandingDaftar(dariDb.sanitasi, dariKode.sanitasi, "sanitasi");
bandingDaftar(dariDb.masalah, dariKode.masalah, "masalah");

for (const key of SASARAN_KEYS) {
  const a = dariDb.sasaran[key];
  const b = dariKode.sasaran[key];
  if (!a || !b) {
    lap(`sasaran.${key}: salah satu sisi kosong`);
    continue;
  }
  if (a.label !== b.label) lap(`sasaran.${key}.label: DB "${a.label}" vs kode "${b.label}"`);
  if (JSON.stringify(a.prioritasDefault) !== JSON.stringify(b.prioritasDefault)) {
    lap(`sasaran.${key}.prioritasDefault: DB ${JSON.stringify(a.prioritasDefault)} vs kode ${JSON.stringify(b.prioritasDefault)}`);
  }
  bandingDaftar(a.fields, b.fields, `sasaran.${key}`);
}

if (dariDb.version !== dariKode.version) lap(`version: DB ${dariDb.version} vs kode ${dariKode.version}`);
if (JSON.stringify(dariDb.hasilOpsi) !== JSON.stringify(dariKode.hasilOpsi)) lap("hasilOpsi");

const totalField =
  dariDb.keluargaInfo.length +
  dariDb.anggota.length +
  dariDb.sanitasi.length +
  dariDb.masalah.length +
  SASARAN_KEYS.reduce((a, k) => a + dariDb.sasaran[k]!.fields.length, 0);

if (beda === 0) {
  console.log(`PARITAS OK: ${totalField} field di database identik dengan template bawaan.`);
  process.exit(0);
}
console.error(`PARITAS GAGAL: ${beda} perbedaan.`);
process.exit(1);
