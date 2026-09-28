/**
 * Seeder Form Builder v2.
 *
 * Dua form bawaan dibuat lewat `forms.kode`, bukan `forms.nama`, supaya seeder
 * bisa menemukan form yang sama pada penjalanan berikutnya meskipun admin
 * sudah mengganti nama formnya.
 *
 * ATURAN PENTING: seeder ini tidak pernah menimpa definisi form yang sudah
 * ada. Kalau `forms.kode` sudah ada, seeder berhenti untuk form itu dan
 * mencetak laporan. Admin yang mengedit field lewat Form Builder tidak boleh
 * kehilangan-editannya hanya karena `pnpm db:seed` dijalankan ulang.
 *
 * Definisi field Form Kunjungan Rumah tidak diketik tangan di sini. Ia
 * diturunkan dari `createDefaultKunjunganRumahTemplates()`, konstanta lokal
 * yang sama dengan fallback dipakai `useKunjunganRumahTemplateDb`. Sebalik
 * `templateFromRows()` membangunkannya lagi dari baris database. Menyalin
 * daftar field ke sini secara manual pasti akan menyimpang dari template
 * lokal setelah salah satu sisipan berubah.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db.server";
import {
  formFieldRules,
  formFields,
  formSections,
  formVersions,
  forms,
} from "@/lib/schema/schema";
import {
  createDefaultKunjunganRumahTemplates,
  KUNJUNGAN_RUMAH_TEMPLATE_VERSION,
} from "@/lib/kunjungan-rumah-templates";
import type {
  KunjunganRumahTemplateField,
} from "@/lib/kunjungan-rumah-templates";
import { SASARAN_KEYS } from "@/lib/kunjungan-rumah-form";
import { namaFieldUnik } from "@/features/kunjungan-rumah/lib/template-from-rows";
import { JENIS_KEGIATAN } from "@/lib/constants";

/** `forms.kode` untuk kedua form bawaan. Jangan diubah: seeding idempotent bergantung padanya. */
export const KODE_FORM = {
  kegiatan: "KEGIATAN_PEMBERDAYAAN",
  kunjunganRumah: "CHECKLIST_KUNJUNGAN_RUMAH",
} as const;

const NAMA_FORM = {
  kegiatan: "Form Kegiatan Pemberdayaan",
  kunjunganRumah: "Form Kunjungan Rumah",
} as const;

type JenisFieldDb =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "time"
  | "image"
  | "file"
  | "group";

/** Bucket layout panel sasaran disimpan sebagai prefix pada `option_source_key`. */
function kunciBucket(bucket: string | null): string | null {
  return bucket === null ? null : `bucket=${bucket}`;
}


/** `section` UI sudah persis nama section di database, jadi tidak perlu dipetakan. */
const SECTION_UI_PLAIN = ["keluargaInfo", "anggota", "sanitasi", "masalah"] as const;

interface BarisField {
  nama: string;
  label: string;
  tipe: JenisFieldDb;
  wajib: boolean;
  urutan: number;
  optionSourceKey: string | null;
  options: string[];
  jumlahKolom: number | null;
}

interface BarisSection {
  nama: string;
  urutan: number;
  fields: BarisField[];
}

/** Field yang menyimpan seluruh payload legacy untuk Form Kunjungan Rumah. */
export const FIELD_RECORD_LEGACY = "record_legacy";

/**
 * Bangun section + field Form Kunjungan Rumah dari template lokal.
 *
 * Bucket diambil dari `field.section` (`sasaran:identitas` → `identitas`),
 * karena `templateFromRows()` memetakannya kembali dengan BUCKET_TO_SECTION.
 */
function sectionsKunjunganRumah(): BarisSection[] {
  const t = createDefaultKunjunganRumahTemplates();
  const sections: BarisSection[] = [];

  const pushField = (
    list: BarisField[],
    f: KunjunganRumahTemplateField,
    sectionNama: string,
    bucket: string | null,
  ): void => {
    list.push({
      nama: namaFieldUnik(sectionNama, f.id),
      label: f.label,
      tipe: f.kind as JenisFieldDb,
      wajib: f.required,
      urutan: f.order,
      optionSourceKey: kunciBucket(bucket),
      options: f.options ?? [],
      jumlahKolom: null,
    });
  };

  (SECTION_UI_PLAIN as readonly string[]).forEach((nama, i) => {
    const fields = t[nama as (typeof SECTION_UI_PLAIN)[number]] ?? [];
    const list: BarisField[] = [];
    fields.forEach((f) => pushField(list, f, nama, null));
    sections.push({ nama, urutan: i, fields: list });
  });

  // Field `record_legacy` tidak ada di template lokal: ia adalah tempat
  // penyimpanan payload, bukan pertanyaan yang dilihat petugas. Ditambahkan di
  // section terakhir supaya tidak menggeser urutan field yang lain.
  sections.push({
    nama: "penyimpanan",
    urutan: sections.length,
    fields: [
      {
        nama: namaFieldUnik("penyimpanan", FIELD_RECORD_LEGACY),
        label: "Data kunjungan rumah (penyimpanan)",
        tipe: "group",
        wajib: false,
        urutan: 0,
        optionSourceKey: null,
        options: [],
        jumlahKolom: null,
      },
    ],
  });

  SASARAN_KEYS.forEach((key, i) => {
    const def = t.sasaran[key];
    const list: BarisField[] = [];
    for (const f of def.fields) {
      const bucket = f.section.startsWith("sasaran:")
        ? f.section.slice("sasaran:".length)
        : null;
      if (bucket === null) {
        throw new Error(
          `Field sasaran "${f.id}" tidak punya bucket yang bisa dibaca; section-nya "${f.section}".`,
        );
      }
      pushField(list, f, key, bucket);
    }
    sections.push({ nama: key, urutan: sections.length + i, fields: list });
  });

  return sections;
}

/**
 * Form Kegiatan Pemberdayaan.
 *
 * Dipisah dari Form Kunjungan Rumah karena submission kegiatan tidak menunjuk
 * warga (`forms.subjekWargaWajib = false`). Field `peserta` berupa `group`
 * karena daftar peserta berulang dan tidak muat di satu select.
 */
function sectionsKegiatan(): BarisSection[] {
  // Nama field di sini tetap dibungkus `namaFieldUnik` supaya kedua form
  // memakai aturan nama yang sama persis, walau id kegiatan memang unik.
  const field = (
    sectionNama: string,
    nama: string,
    label: string,
    tipe: JenisFieldDb,
    urutan: number,
    extra: Partial<BarisField> = {},
  ): BarisField => ({
    nama: namaFieldUnik(sectionNama, nama),
    label,
    tipe,
    wajib: false,
    urutan,
    optionSourceKey: null,
    options: [],
    jumlahKolom: null,
    ...extra,
  });

  return [
    {
      nama: "identitas",
      urutan: 0,
      fields: [
        field("identitas", "nama", "Nama kegiatan", "text", 0, { wajib: true }),
        field("identitas", "jenis", "Jenis kegiatan", "select", 1, {
          wajib: true,
          options: [...JENIS_KEGIATAN],
        }),
        field("identitas", "tgl", "Tanggal", "date", 2, { wajib: true }),
        field("identitas", "jam", "Jam", "time", 3),
        field("identitas", "lokasi", "Lokasi", "text", 4, { wajib: true }),
        field("identitas", "kel", "Kelurahan", "text", 5, { wajib: true }),
        field("identitas", "pj", "Penanggung jawab", "text", 6, { wajib: true }),
        field("identitas", "target", "Target", "text", 7),
        field("identitas", "posy", "Posyandu", "text", 8),
        field("identitas", "deskripsi", "Deskripsi", "textarea", 9),
      ],
    },
    {
      nama: "peserta",
      urutan: 1,
      fields: [
        field("peserta", "peserta", "Daftar peserta", "group", 0, { jumlahKolom: 3 }),
        field("peserta", "hadir", "Jumlah hadir", "number", 1),
        field("peserta", "total", "Jumlah peserta", "number", 2),
      ],
    },
    {
      nama: "dokumentasi",
      urutan: 2,
      fields: [field("dokumentasi", "foto", "Foto kegiatan", "image", 0)],
    },
  ];
}

export interface LaporanSeed {
  kode: string;
  dibuat: boolean;
  versi: number | null;
}

/**
 * Buat satu form beserta versi published pertama.
 *
 * Kalau `forms.kode` sudah ada, fungsi ini mengembalikan `dibuat: false` tanpa
 * menyentuh satu baris pun. Itu yang menjaga editan admin tetap utuh.
 */
async function seedForm(params: {
  kode: string;
  nama: string;
  deskripsi: string;
  subjekWargaWajib: boolean;
  /** Angka di kolom `form_versions.version`; lihat catatan di dalam fungsi. */
  nomorVersi: number;
  sections: BarisSection[];
}): Promise<boolean> {
  const existing = await db
    .select({ id: forms.id })
    .from(forms)
    .where(eq(forms.kode, params.kode))
    .limit(1);
  if (existing.length > 0) return false;

  // Semua penulisan satu form ditulis dalam satu transaksi. Insert per baris di luar
  // transaksi berarti satu round trip ke server Postgres per field, dan Form
  // Kunjungan Rumah punya ~360 field — dari mesin lokal lewat pooler Supabase
  // itu berjam-jam. Dengan satu transaksi, ratusan baris selesai dalam
  // hitungan detik. Kalau ada field yang gagal, tidak ada form setengah jadi.
  return db.transaction(async (tx) => {
    const now = new Date();
    const [form] = await tx
      .insert(forms)
      .values({
        nama: params.nama,
        kode: params.kode,
        deskripsi: params.deskripsi,
        subjekWargaWajib: params.subjekWargaWajib,
      })
      .returning();
    if (!form) throw new Error(`Gagal membuat form "${params.nama}"`);

    // Nomor versi BUKAN selalu 1. `form_versions.version` dibaca
    // `templateFromRows()` sebagai penanda "definisi di DB milik template yang
    // sedang berjalan", dan nilainya harus sama dengan
    // KUNJUNGAN_RUMAH_TEMPLATE_VERSION. Kalau di-seed dengan angka 1, seluruh
    // form kunjungan rumah gagal dibuka dengan error versi tidak cocok.
    //
    // Status tetap langsung `published`, bukan `draft`: form bawaan harus bisa
    // dipakai petugas tanpa langkah publish manual. `publishedAt` wajib terisi
    // karena check `form_versions_published_at_check` menagihnya.
    const [versi] = await tx
      .insert(formVersions)
      .values({
        formId: form.id,
        version: params.nomorVersi,
        status: "published",
        publishedAt: now,
      })
      .returning();
    if (!versi) throw new Error(`Gagal membuat versi untuk form "${params.nama}"`);

    for (const s of params.sections) {
      const [section] = await tx
        .insert(formSections)
        .values({
          formVersionId: versi.id,
          nama: s.nama,
          urutan: s.urutan,
        })
        .returning();
      if (!section) throw new Error(`Gagal membuat section "${s.nama}"`);
      if (s.fields.length === 0) continue;

      // Field satu section di-insert sekaligus. Insert per field dengan
      // `.returning()` berarti satu round trip per field; section sasaran punya
      // puluhan field dan satu round trip lewat pooler Supabase(~0,3 detik),
      // jadi Form Kunjungan Rumah akan memakan waktu lama sekali.
      const kolom = await tx
        .insert(formFields)
        .values(
          s.fields.map((f) => ({
            formVersionId: versi.id,
            sectionId: section.id,
            nama: f.nama,
            label: f.label,
            tipe: f.tipe,
            wajib: f.wajib,
            urutan: f.urutan,
            optionSourceKey: f.optionSourceKey,
            jumlahKolom: f.jumlahKolom,
          })),
        )
        .returning({ id: formFields.id, nama: formFields.nama });
      if (kolom.length !== s.fields.length) {
        throw new Error(
          `Field section "${s.nama}": hope ${s.fields.length}, tersimpan ${kolom.length}.`,
        );
      }

      // Semua opsi di seluruh section di-insert sekaligus. `form_field_rules`
      // tidak butuh id balikan per opsi, jadi ini cukup satu round trip.
      const opsiRows = kolom.flatMap((col) => {
        const f = s.fields.find((x) => x.nama === col.nama)
        if (!f || f.options.length === 0) return []
        return f.options.map((value, i) => ({
          fieldId: col.id,
          tipe: "option" as const,
          value,
          urutan: i,
        }))
      })
      if (opsiRows.length > 0) await tx.insert(formFieldRules).values(opsiRows)
    }

    return true;
  });
}

export async function seedFormDefaults(): Promise<LaporanSeed[]> {
  const laporan: LaporanSeed[] = [];

  const kegiatan = await seedForm({
    kode: KODE_FORM.kegiatan,
    nama: NAMA_FORM.kegiatan,
    deskripsi:
      "Catatan kegiatan pemberdayaan. Tidak menunjuk warga per-submission; daftar peserta disimpan di field peserta.",
    subjekWargaWajib: false,
    nomorVersi: 1,
    sections: sectionsKegiatan(),
  });
  laporan.push({
    kode: KODE_FORM.kegiatan,
    dibuat: kegiatan,
    versi: kegiatan ? 1 : null,
  });

  const kunjungan = await seedForm({
    kode: KODE_FORM.kunjunganRumah,
    nama: NAMA_FORM.kunjunganRumah,
    deskripsi:
      "Checklist kunjungan rumah. Setiap submission wajib menunjuk satu warga.",
    subjekWargaWajib: true,
    nomorVersi: KUNJUNGAN_RUMAH_TEMPLATE_VERSION,
    sections: sectionsKunjunganRumah(),
  });
  laporan.push({
    kode: KODE_FORM.kunjunganRumah,
    dibuat: kunjungan,
    versi: kunjungan ? KUNJUNGAN_RUMAH_TEMPLATE_VERSION : null,
  });

  return laporan;
}
