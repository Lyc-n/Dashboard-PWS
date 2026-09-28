import { HASIL_KUNJUNGAN_RUMAH } from "@/lib/constants";
import { KUNJUNGAN_RUMAH_TEMPLATE_VERSION } from "@/lib/kunjungan-rumah-templates";
import type {
  KunjunganRumahFieldKind,
  KunjunganRumahSasaranTemplate,
  KunjunganRumahSection,
  KunjunganRumahTemplateField,
  KunjunganRumahTemplates,
} from "@/lib/kunjungan-rumah-templates";
import { SASARAN_DEFS, SASARAN_KEYS } from "@/lib/kunjungan-rumah-form";
import type { SasaranKey } from "@/lib/kunjungan-rumah-form";

/** `forms.nama` untuk form kunjungan rumah. Dipakai juga sebagai kunci lookup di server. */
export const FORM_KUNJUNGAN_RUMAH = "Form Kunjungan Rumah";

/**
 * Pemisah antara nama section dan nama field pada `form_fields.nama`.
 *
 * Template lokal memakai ulang id field antar section — `nama`, `nik`, dan
 * `tglLahir` muncul di section `anggota`, `masalah`, dan hampir setiap sasaran,
 * jadi 353 field hanya punya 220 id unik. Tapi
 * `form_fields_form_version_nama_key` mewajibkan `nama` unik per versi form.
 *
 * Seeder karena itu menyimpan `<section>::<id>`, dan pembaca baris di
 * `src/lib/utils.server.ts` membongkar prefix-nya lagi sebelum meneruskan ke
 * `templateFromRows()` di file ini. Kedua sisi harus diubah bersamaan;
 * `pnpm db:check-parity` adalah penjaganya.
 */
export const PEMBATAS_NAMA_FIELD = "::";

/** Nama field unik per versi form, dengan section sebagai namespace. */
export function namaFieldUnik(sectionNama: string, fieldId: string): string {
  return `${sectionNama}${PEMBATAS_NAMA_FIELD}${fieldId}`;
}

/** Bucket di DB dipetakan ke section UI dengan prefix `sasaran:`. */
const BUCKET_TO_SECTION: Record<string, KunjunganRumahSection> = {
  identitas: "sasaran:identitas",
  kolom: "sasaran:kolom",
  bools: "sasaran:bools",
  baha: "sasaran:baha",
};

const SasaranKeys = new Set<string>(SASARAN_KEYS);

/** Section non-sasaran: nama section di DB sudah sama dengan section di UI. */
const PLAIN_SECTIONS = ["keluargaInfo", "anggota", "sanitasi", "masalah"] as const;
type PlainSection = (typeof PLAIN_SECTIONS)[number];

/** Bentuk baris yang dikirim server fn. Sudah diratakan supaya aman lewat RPC. */
export interface TemplateQuestionRow {
  kode: string;
  pertanyaan: string;
  tipe: string;
  bucket: string | null;
  hint: string | null;
  wajib: boolean;
  urutan: number;
  opsi: string[];
}

export interface KunjunganRumahTemplateRows {
  version: number;
  questions: Record<string, TemplateQuestionRow[]>;
}

function toField(row: TemplateQuestionRow, section: KunjunganRumahSection, order: number, sasaranKey?: SasaranKey): KunjunganRumahTemplateField {
  return {
    id: row.kode,
    label: row.pertanyaan,
    kind: row.tipe as KunjunganRumahFieldKind,
    section,
    ...(sasaranKey ? { sasaranKey } : {}),
    required: row.wajib,
    active: true,
    order,
    ...(row.opsi.length > 0 ? { options: row.opsi } : {}),
    ...(row.hint ? { hint: row.hint } : {}),
  };
}

/**
 * Bangun `KunjunganRumahTemplates` dari baris database.
 *
 * Yang diambil dari DB: section, kode, label, tipe, opsi select, hint, bucket layout,
 * urutan, dan flag wajib. Yang tetap dari kode: `version`, `hasilOpsi`, `prioritasDefault`,
 * dan `conditionals` — tiga hal itu masih konstanta TS sesuai keputusan "definisi saja
 * dari DB", dan `KunjunganRumahTemplates.version` bertipe literal jadi tidak bisa
 * diambil dari kolom.
 *
 * Baris `tipe: "group"` dilewati: grup hanya untuk grouping struktural (blok K1, KF1, dst)
 * dan tidak pernah dirender sebagai field. Karena grup ikut menggeser `urutan` di DB,
 * `order` dihitung ulang dari posisi setelah grup dibuang — itu yang membuatnya sama
 * dengan template lokal.
 */
export function templateFromRows(rows: KunjunganRumahTemplateRows): KunjunganRumahTemplates {
  // `version` disimpan di kolom `forms.version`. Kalau berbeda dari konstanta di kode,
  // definisi di DB bukan milik versi template yang sedang berjalan — lebih baik gagal
  // keras daripada diam-diam merender field yang sudah tidak cocok.
  if (rows.version !== KUNJUNGAN_RUMAH_TEMPLATE_VERSION) {
    throw new Error(
      `Version form di database (${rows.version}) tidak cocok dengan template aplikasi (${KUNJUNGAN_RUMAH_TEMPLATE_VERSION}). Jalankan ulang seeder atau naikkan KUNJUNGAN_RUMAH_TEMPLATE_VERSION.`
    );
  }

  // `version` dan `hasilOpsi` sengaja dari kode, bukan dari rows — lihat catatan fungsi.
  const plain: Record<PlainSection, KunjunganRumahTemplateField[]> = {
    keluargaInfo: [],
    anggota: [],
    sanitasi: [],
    masalah: [],
  };

  const sasaran = {} as Record<SasaranKey, KunjunganRumahSasaranTemplate>;

  for (const key of SASARAN_KEYS) {
    const def = SASARAN_DEFS.find((d) => d.key === key);
    if (!def) throw new Error(`Sasaran "${key}" tidak ada di SASARAN_DEFS`);
    sasaran[key] = { label: def.label, fields: [], prioritasDefault: [...def.prioritasDefault] };
  }

  for (const sectionNama of Object.keys(rows.questions)) {
    const list = rows.questions[sectionNama] ?? [];
    const leaves = list
      .filter((row) => row.tipe !== "group")
      .sort((a, b) => a.urutan - b.urutan);

    if (SasaranKeys.has(sectionNama)) {
      const key = sectionNama as SasaranKey;
      // `sasaran` sudah diisi untuk setiap SASARAN_KEYS di atas, jadi entry ini selalu ada.
      const target = sasaran[key];

      target.fields = leaves.map((row, index) => {
        const section = row.bucket ? BUCKET_TO_SECTION[row.bucket] : undefined;
        if (!section) {
          throw new Error(`Question "${row.kode}" pada section ${sectionNama} punya bucket tidak valid: ${row.bucket}`);
        }
        return toField(row, section, index, key);
      });
      continue;
    }

    if ((PLAIN_SECTIONS as readonly string[]).includes(sectionNama)) {
      plain[sectionNama as PlainSection] = leaves.map((row, index) =>
        toField(row, sectionNama as PlainSection, index)
      );
      continue;
    }

    // Section yang tidak dikenal (mis. `hasil`, yang memang tanpa question) diabaikan
    // diam-diam supaya section tambahan tidak menggagalkan seluruh form.
  }

  return {
    version: KUNJUNGAN_RUMAH_TEMPLATE_VERSION,
    keluargaInfo: plain.keluargaInfo,
    anggota: plain.anggota,
    sanitasi: plain.sanitasi,
    sasaran,
    masalah: plain.masalah,
    hasilOpsi: [...HASIL_KUNJUNGAN_RUMAH],
  };
}
