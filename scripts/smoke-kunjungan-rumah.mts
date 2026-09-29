/**
 * Uji asap alur kunjungan rumah terhadap database uji coba.
 *
 * Cakupan: NIK sasaran utama tersimpan sebagai `surveys.wargaNik`, petugas
 * tersimpan sebagai `surveys.petugasId`, payload bisa dibaca balik, dan
 * query dashboard/sasaran mengenali warga dummy tersebut.
 *
 * PENGAMAN DATABASE
 * -----------------
 * Skrip ini hanya boleh menunjuk database uji. Ia menolak berjalan kalau nama
 * database/URL tidak mengandung salah satu penanda: uji, trial, test,
 * staging, dev, localhost, atau 127.0.0.1. Jalankan dengan override eksplisit,
 * misalnya:
 *
 *     DATABASE_URL="postgresql://.../dashboard_pws_uji_schema" \
 *       pnpm db:smoke-kunjungan-rumah
 *
 * Semua baris dummy memakai NIK sintetis `9000000000000001` dan dihapus di
 * akhir, termasuk bila ada sisa dari penjalanan sebelumnya.
 */
import { eq } from "drizzle-orm";
import { db } from "@/lib/db.server";
import { dataWargaTable, surveys } from "@/lib/schema/schema";
import { HASIL_KUNJUNGAN_RUMAH } from "@/lib/constants";
import { listPetugasOpsi } from "@/lib/user-registry.server";
import {
  getKunjunganRumahRecord,
  listKunjunganRumahRecords,
  querySurveysWithWarga,
  querySurveyStatsByNik,
  queryWargaList,
  removeKunjunganRumahRecord,
  saveKunjunganRumahRecord,
} from "@/lib/utils.server";

const NIK_DUMMY = "9000000000000901";
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

async function bersihkanSisaDummy(): Promise<void> {
  await db.delete(surveys).where(eq(surveys.wargaNik, NIK_DUMMY));
  await db.delete(dataWargaTable).where(eq(dataWargaTable.nik, NIK_DUMMY));
}

async function main(): Promise<void> {
  pastikanDatabaseUji();
  await bersihkanSisaDummy();

  const [petugas] = await listPetugasOpsi(null);
  if (!petugas) throw new Error("Tidak ada petugas aktif di database uji.");

  await db.insert(dataWargaTable).values({
    nik: NIK_DUMMY,
    nama_art: "UJI COBA DUMMY",
    nama_kk: "UJI COBA DUMMY",
    hubungan_keluarga: "Kepala Keluarga",
    alamat: "JL UJI COBA 1",
    tgl_lahir: "1990-01-01",
    rt: "001",
    rw: "001",
    kecamatan: "PANGGUNGREJO",
    kelurahan: "Trajeng",
    kota: "Kota Pasuruan",
    status_kawin: "kawin",
    staff: petugas.id,
    jenis_kelamin: "perempuan",
    wanita_usia_hamil: false,
    agama: "Islam",
    pendidikan: "SLTA/Sederajat",
    pekerjaan: "IRT",
  });

  const hariIni = new Date().toISOString().slice(0, 10);
  const sekarang = new Date().toISOString();
  let idTersimpan: string | null = null;

  try {
    const tersimpan = await saveKunjunganRumahRecord({
      waktuSimpan: sekarang,
      info: {
        tglPengumpulan: hariIni,
        alamat: "JL UJI COBA 1",
        kelurahan: "Trajeng",
        kecamatan: "PANGGUNGREJO",
        kabKota: "Kota Pasuruan",
        provinsi: "Jawa Timur",
        hpKK: "080000000001",
        puskesmas: "Puskesmas Trajeng",
        pustu: "",
        posyandu: petugas.fasKes,
        namaKK: "UJI COBA DUMMY",
        nik: NIK_DUMMY,
        petugasId: petugas.id,
        petugasNama: petugas.nama,
      },
      sanitasi: {
        jkn: true,
        jenisAir: "Ledeng/PDAM",
        jambanSaniter: "Kloset",
        ventilasi: true,
        odgj: false,
        tbc: false,
        hipertensi: false,
        dm: false,
      },
      anggota: [
        {
          id: "uji-anggota-1",
          nama: "UJI COBA DUMMY",
          nik: NIK_DUMMY,
          tglLahir: "1990-01-01",
          jk: "P",
          hubKK: "Kepala Keluarga",
          statusKawin: "kawin",
          pendidikan: "SLTA/Sederajat",
          pekerjaan: "IRT",
        },
      ],
      penilaian: [
        {
          id: "uji-nilai-1",
          anggotaId: "uji-anggota-1",
          sasaran: "dewasa",
          values: {},
          checks: {},
          prioritas: [],
        },
      ],
      masalah: [],
      hasil: HASIL_KUNJUNGAN_RUMAH[0],
      jadwal: "",
      ttd: petugas.nama,
      fotos: [
        {
          id: "uji-foto-1",
          name: "uji.png",
          dataUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          caption: "Foto uji",
          takenAt: sekarang,
        },
      ],
    });
    const tersimpanSebagai = tersimpan as { id?: unknown };
    if (typeof tersimpanSebagai.id !== "string" || !tersimpanSebagai.id) {
      throw new Error("Respons simpan kunjungan tidak berisi id.");
    }
    idTersimpan = tersimpanSebagai.id;
    console.log(`OK disimpan: id=${idTersimpan}`);

    const daftar = await listKunjunganRumahRecords();
    if (!daftar.some((r) => (r as { id?: unknown }).id === idTersimpan)) {
      throw new Error("Kunjungan yang baru disimpan tidak muncul di daftar riwayat.");
    }
    const satu = await getKunjunganRumahRecord(idTersimpan);
    const info = (satu as { info?: { nik?: unknown; petugasId?: unknown } } | null)?.info;
    if (info?.nik !== NIK_DUMMY || info?.petugasId !== petugas.id) {
      throw new Error("Payload yang dibaca balik tidak sama dengan yang disimpan.");
    }
    console.log("OK dibaca balik: NIK dan petugas utuh.");

    const warga = await queryWargaList();
    if (!warga.some((w) => w.nik === NIK_DUMMY)) {
      throw new Error("Warga dummy tidak muncul di Data Sasaran.");
    }
    const statistik = await querySurveyStatsByNik();
    const baris = statistik.find((s) => s.nik === NIK_DUMMY);
    if (!baris || baris.total !== 1 || baris.terakhir !== hariIni) {
      throw new Error("Statistik dashboard tidak mengenali kunjungan dummy.");
    }
    const terbaru = await querySurveysWithWarga(50);
    const barisTerbaru = terbaru.find((s) => s.nik === NIK_DUMMY);
    if (!barisTerbaru || barisTerbaru.petugas !== petugas.nama) {
      throw new Error("Daftar kunjungan terbaru tidak menampilkan petugas dummy.");
    }
    console.log("OK dashboard/sasaran: warga, statistik, dan petugas terbaca.");
  } finally {
    if (idTersimpan) {
      await removeKunjunganRumahRecord(idTersimpan);
      console.log(`Dihapus kunjungan uji: ${idTersimpan}`);
    }
    await bersihkanSisaDummy();
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
