/**
 * Registry pengguna.
 *
 * Sumber data tunggal untuk siapa saja yang boleh jadi petugas pencatat
 * (dropdown petugas di Form Kunjungan Rumah, dropdown petugas di Form Kegiatan
 * Pemberdayaan, dan daftar kader di Rekap Kunjungan Rumah). Semuanya membaca
 * tabel `users`, bukan tabel `admin_staff` yang sudah dihapus.
 *
 * CATATAN PENTING SOAL AUTENTIKASI
 * --------------------------------
 * Modul ini BUKAN sumber autentikasi. Login aplikasi memakai satu PIN global
 * dari environment (`isValidPin` membandingkan dengan `process.env.PIN`), dan
 * `SESSION_PROFILE` adalah konstanta hard-coded dengan role "Admin". Akibatnya:
 *
 *   - `users.pinHash` tidak pernah dipakai untuk memverifikasi siapa pun.
 *   - `requireAdmin` lolos untuk siapa saja yang punya sesi valid, karena role
 *     dibaca dari `SESSION_PROFILE`, bukan dari baris `users`.
 *   - Tidak ada pemetaan sesi -> `users.id`, jadi `surveys.petugasId` tidak
 *     bisa diisi "otomatis dari siapa yang login".
 *
 * Karena itu `pinHash` di sini diisi penanda yang tidak bisa dipakai login
 * (lihat `PENANDA_PIN_TIDAK_DIGUNAKAN`), dan petugas selalu dipilih manual di
 * form. Mengganti PIN global dengan login per-akun adalah pekerjaan tersendiri
 * yang belum dikerjakan; lihat catatan di `src/lib/auth.ts`.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db.server";
import { fasilitasKesehatan, users, wilayahKerja } from "@/lib/schema/schema";
import type { Staff } from "@/lib/staff";
import { petakanPeran } from "@/lib/user-registry";
import type { BarisPengguna, OpsiFasilitas, OpsiPetugas } from "@/lib/user-registry";

/**
 * Nilai yang disimpan di `users.pinHash` untuk akun yang dibuat lewat registry.
 *
 * Kolomnya NOT NULL, tapi tidak ada alur yang memverifikasi hash ini (login
 * memakai PIN global). Nilai berawalan "!" dipilih supaya jelas tidak pernah
 * menjadi hash PIN yang sah: kalau suatu saat login per-akun diimplementasikan,
 * akun dengan nilai ini harus dipaksa mengatur PIN baru, bukan diam-diam bisa
 * login.
 */
export const PENANDA_PIN_TIDAK_DIGUNAKAN = "!belum-diatur";


const SELECT_PENGGUNA = {
  id: users.id,
  nama: users.nama,
  role: users.role,
  phone: users.phone,
  aktif: users.aktif,
  fasKesId: users.fasKesId,
  fasKes: sql<string>`${fasilitasKesehatan.nama}`,
  kel: sql<string>`${wilayahKerja.kelurahan}`,
  kecamatan: sql<string>`${wilayahKerja.kecamatan}`,
};

/**
 * Semua akun, urut nama. Dipakai form Staff di /kelola.
 *
 * Akun nonaktif ikut dikembalikan supaya bisa diaktifkan lagi tanpa membuat
 * baris baru; filter "aktif" dilakukan di sisi pemanggil.
 */
export async function listPengguna(): Promise<BarisPengguna[]> {
  return await db
    .select(SELECT_PENGGUNA)
    .from(users)
    .innerJoin(fasilitasKesehatan, eq(users.fasKesId, fasilitasKesehatan.id))
    .innerJoin(wilayahKerja, eq(fasilitasKesehatan.wilayahKerjaId, wilayahKerja.id))
    .orderBy(users.nama);
}

/**
 * Daftar kader aktif, diproyeksikan ke bentuk `Staff` supaya
 * `computeRekap()` dan `kaderNameOf()` di `src/lib/rekap-kunjungan-rumah.ts`
 * tidak perlu diubah. `peran` diisi dari `role`; hanya 'kader' yang muncul di
 * sini.
 *
 * @param fasKesId Batasi ke satu fasilitas. null = semua fasilitas.
 */
export async function listKaderAktif(fasKesId?: number | null): Promise<Staff[]> {
  const baris = await listPengguna();
  return baris
    .filter((u) => u.aktif && u.role === "kader")
    .filter((u) => fasKesId === null || fasKesId === undefined || u.fasKesId === fasKesId)
    .map((u) => keStaff(u));
}

/**
 * Proyeksi baris `users` ke bentuk `Staff`.
 *
 * `Staff` dipakai ulang karena `computeRekap()` mencocokkan kader lewat
 * `s.posy` dan `s.kel`; bentuk itu persis dengan yang bisa diambil dari
 * `fasilitas_kesehatan` + `wilayah_kerja`, jadi tidak perlu tipe baru.
 */
export function keStaff(u: BarisPengguna): Staff {
  return {
    nama: u.nama,
    peran: u.role,
    kel: u.kel,
    posy: u.fasKes,
    hp: u.phone ?? "",
    // Tidak ada kolom username di `users`; login memakai PIN global.
    // Field ini di UI hanya ditampilkan kalau diisi manual.
    username: "",
    on: u.aktif,
  };
}

/**
 * Akun yang boleh jadi petugas pencatat: role `staff` dan `kader`, yang aktif.
 *
 * `admin` sengaja tidak ikut. Akun admin dipakai untuk mengelola form, bukan
 * untuk mencatat kunjungan, dan memasukkan admin ke sini membuat rekap
 * nilainya tercampur dengan petugas lapangan.
 */
export async function listPetugasOpsi(fasKesId?: number | null): Promise<OpsiPetugas[]> {
  const baris = await listPengguna();
  return baris
    .filter((u) => u.aktif && u.role === "kader")
    .filter((u) => fasKesId === null || fasKesId === undefined || u.fasKesId === fasKesId)
    .map((u) => ({ id: u.id, nama: u.nama, fasKes: u.fasKes }));
}

/**
 * Pastikan id yang dikirim benar-benar akun petugas yang aktif.
 *
 * Dipanggil sebelum menyimpan survey atau kegiatan. `surveys.petugasId` punya FK
 * ke `users`, jadi id ngawur akan ditolak database dengan pesan yang tidak
 * membantu petugas; lebih baik ditolak di sini dengan alasan yang jelas.
 * `role = 'admin'` juga ditolak karena alasan yang sama seperti di
 * `listPetugasOpsi()`.
 *
 * Mengembalikan `id` dan `nama` sekaligus. `id` dipakai untuk
 * `surveys.petugasId`; `nama` untuk ditampilkan. Keduanya dikembalikan karena
 * pemanggil hampir selalu butuh keduanya.
 *
 * Parameter dibikin nullable karena pemanggilnya lewat dari payload yang belum
 * divalidasi, jadi `null`/`undefined` itu nilai nyata dan bukan kebetulan.
 */
export async function pastikanPetugasValid(
  petugasId: string | null | undefined,
): Promise<{ id: string; nama: string }> {
  const id = (petugasId ?? "").trim();
  if (!id) throw new Error("Petugas wajib dipilih sebelum menyimpan.");

  const [baris] = await db
    .select({ id: users.id, nama: users.nama, role: users.role, aktif: users.aktif })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!baris) throw new Error("Petugas yang dipilih tidak ditemukan.");
  if (!baris.aktif) throw new Error("Petugas yang dipilih sudah dinonaktifkan.");
  if (baris.role === "admin") {
    throw new Error("Akun admin tidak bisa dipilih sebagai petugas pencatat.");
  }
  return { id: baris.id, nama: baris.nama };
}

function asJsonRecord(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    throw new Error("Data pengguna tidak valid.");
  }
  return v as Record<string, unknown>;
}

function teks(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v.trim() : fallback;
}

/** True bila nama sudah dipakai akun lain (bukan akun yang sedang diedit). */
async function namaSudahDipakai(nama: string, kecualiId?: string): Promise<boolean> {
  const baris = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.nama, nama))
    .limit(1);
  return baris.length > 0 && baris[0]!.id !== kecualiId;
}

/**
 * Simpan akun baru atau ubah yang lama.
 *
 * `namaLama` = nama sebelum diubah; null berarti baris baru. Pencocokan pakai
 * nama karena form Staff tidak menyimpan id, sama seperti implementasi
 * `admin_staff` sebelumnya.
 *
 * `users.nama` tidak punya constraint unique, jadi nama yang sama dicek manual di
 * sini. Alasannya nama jadi kunci praktis: `listKaderAktif()` memproyeksikan ke
 * `Staff` dan `kaderNameOf()` mencocokkan lewat `s.nama`, jadi dua akun dengan
 * nama sama akan menggabungkan rekap dua kader berbeda.
 */
export async function simpanPengguna(namaLama: string | null, data: unknown): Promise<BarisPengguna> {
  const rec = asJsonRecord(data);

  const nama = teks(rec.nama);
  if (!nama) throw new Error('Field "nama" wajib diisi.');

  const { role } = petakanPeran(teks(rec.peran, "Kader"));

  const fasKesId = Number(rec.fasKesId);
  if (!Number.isInteger(fasKesId) || fasKesId <= 0) {
    throw new Error("Fasilitas kesehatan wajib dipilih.");
  }
  const [fas] = await db
    .select({ id: fasilitasKesehatan.id })
    .from(fasilitasKesehatan)
    .where(eq(fasilitasKesehatan.id, fasKesId))
    .limit(1);
  if (!fas) throw new Error("Fasilitas kesehatan yang dipilih tidak ditemukan.");

  const values = {
    nama,
    role,
    phone: teks(rec.phone) || null,
    aktif: rec.on !== false,
    fasKesId,
  };

  const lama = namaLama ? teks(namaLama) : "";
  if (lama) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.nama, lama))
      .limit(1);

    if (existing) {
      if (await namaSudahDipakai(nama, existing.id)) {
        throw new Error(`Akun dengan nama "${nama}" sudah ada.`);
      }
      await db.update(users).set(values).where(eq(users.id, existing.id));
      const hasil = await ambilSatu(existing.id);
      if (!hasil) throw new Error("Gagal menyimpan pengguna.");
      return hasil;
    }
  }

  if (await namaSudahDipakai(nama)) {
    throw new Error(`Akun dengan nama "${nama}" sudah ada.`);
  }

  const [inserted] = await db
    .insert(users)
    .values({
      ...values,
      // Tidak ada akun per-staf yang bisa login, jadi hash ini hanya penanda.
      pinHash: PENANDA_PIN_TIDAK_DIGUNAKAN,
    })
    .returning({ id: users.id });
  if (!inserted) throw new Error("Gagal menyimpan pengguna.");
  const hasil = await ambilSatu(inserted.id);
  if (!hasil) throw new Error("Gagal menyimpan pengguna.");
  return hasil;
}

/**
 * Nonaktifkan / aktifkan akun.
 *
 *soft delete: barisnya tetap ada karena `audit_logs.userId` menunjuk ke sana.
 * Menghapus akun akan membuat jejak audit lama berantai jadi NULL.
 */
export async function setPenggunaAktif(nama: string, aktif: boolean): Promise<void> {
  const ada = await db.update(users).set({ aktif }).where(eq(users.nama, nama)).returning({ id: users.id });
  if (ada.length === 0) throw new Error("Pengguna tidak ditemukan.");
}

async function ambilSatu(id: string): Promise<BarisPengguna | null> {
  const [baris] = await db
    .select(SELECT_PENGGUNA)
    .from(users)
    .innerJoin(fasilitasKesehatan, eq(users.fasKesId, fasilitasKesehatan.id))
    .innerJoin(wilayahKerja, eq(fasilitasKesehatan.wilayahKerjaId, wilayahKerja.id))
    .where(eq(users.id, id))
    .limit(1);
  return baris ?? null;
}

export async function listFasKes(): Promise<OpsiFasilitas[]> {
  return await db
    .select({
      id: fasilitasKesehatan.id,
      nama: fasilitasKesehatan.nama,
      kel: sql<string>`${wilayahKerja.kelurahan}`,
      kecamatan: sql<string>`${wilayahKerja.kecamatan}`,
      tipe: fasilitasKesehatan.fasKesType,
    })
    .from(fasilitasKesehatan)
    .innerJoin(wilayahKerja, eq(fasilitasKesehatan.wilayahKerjaId, wilayahKerja.id))
    .orderBy(wilayahKerja.kelurahan, fasilitasKesehatan.nama);
}
