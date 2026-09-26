import { describe, expect, it } from "vitest";
import { seedKunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import { validateKunjunganRumah } from "@/features/kunjungan-rumah/services/validateKunjunganRumah";
import type { ValidateInput } from "@/features/kunjungan-rumah/services/validateKunjunganRumah";
import type { KunjunganRumahFoto } from "@/features/kunjungan-rumah/models";

const templates = seedKunjunganRumahTemplates();

const foto: KunjunganRumahFoto = {
  id: "f1",
  name: "kunjungan.jpg",
  dataUrl: "data:image/jpeg;base64,AAA",
  caption: "",
  takenAt: "2026-02-14T08:00:00.000Z",
};

function validInput(): ValidateInput {
  return {
    info: {
      tglPengumpulan: "2026-02-14",
      alamat: "Jl. Ngemplakrejo gg. III no. 12",
      kelurahan: "Ngemplakrejo",
      kecamatan: "Trajeng",
      kabKota: "Kota Pasuruan",
      provinsi: "Jawa Timur",
      hpKK: "081234567890",
      puskesmas: "Puskesmas Trajeng",
      pustu: "",
      posyandu: "Mawar 2",
      namaKK: "Bpk. Salim",
      petugasId: "sv1",
      petugasNama: "Siti Aminah",
    },
    anggota: [
      {
        id: "a1",
        nama: "Budi Setiawan",
        nik: "3579015202800001",
        tglLahir: "1980-02-15",
        jk: "L",
        hubKK: "Anak",
        statusKawin: "Kawin",
        pendidikan: "SMA",
        pekerjaan: "Buruh",
      },
    ],
    penilaian: [{ id: "p1", anggotaId: "a1", sasaran: "dewasa", values: {}, checks: {}, prioritas: [] }],
    masalah: [],
    hasil: templates.hasilOpsi[0] ?? "",
    jadwal: "",
    ttd: "Siti Aminah",
    fotos: [foto],
    templates,
  };
}

describe("validateKunjunganRumah", () => {
  it("lolos untuk isian minimal valid", () => {
    const { ok, invalid } = validateKunjunganRumah(validInput());
    expect(ok).toBe(true);
    expect(invalid).toEqual({});
  });

  it("tolak info kosong + tanpa anggota + tanpa penilaian", () => {
    const input = validInput();
    input.info.tglPengumpulan = "";
    input.info.posyandu = "";
    input.anggota = [];
    input.penilaian = [];
    input.ttd = "";
    const { ok, invalid } = validateKunjunganRumah(input);
    expect(ok).toBe(false);
    expect(invalid.tgl).toBe(true);
    expect(invalid.posyandu).toBe(true);
    expect(invalid.anggota).toBe(true);
    expect(invalid.penilaian).toBe(true);
    expect(invalid.ttd).toBe(true);
  });

  it("tolak NIK duplikat dan NIK tidak 16 digit", () => {
    const input = validInput();
    input.anggota = [
      { ...input.anggota[0]!, id: "a1" },
      { ...input.anggota[0]!, id: "a2" },
    ];
    const dup = validateKunjunganRumah(input);
    expect(dup.ok).toBe(false);
    expect(dup.invalid["nik:a2"]).toBe(true);

    const bad = validInput();
    bad.anggota[0]!.nik = "123";
    const res = validateKunjunganRumah(bad);
    expect(res.ok).toBe(false);
    expect(res.invalid["nik:a1"]).toBe(true);
  });

  it("wajibkan jadwal saat hasil kontrol ulang", () => {
    const input = validInput();
    const kontrolUlang = templates.hasilOpsi[1];
    expect(kontrolUlang).toBeDefined();
    input.hasil = kontrolUlang as string;
    input.jadwal = "";
    expect(validateKunjunganRumah(input).ok).toBe(false);
    input.jadwal = "2026-03-01";
    expect(validateKunjunganRumah(input).ok).toBe(true);
  });

  it("tolak hasil di luar opsi template", () => {
    const input = validInput();
    input.hasil = "Hasil fiktif";
    const { ok, invalid } = validateKunjunganRumah(input);
    expect(ok).toBe(false);
    expect(invalid.hasil).toBe(true);
  });

  it("wajibkan minimal 1 foto dokumentasi", () => {
    const input = validInput();
    input.fotos = [];
    const { ok, invalid } = validateKunjunganRumah(input);
    expect(ok).toBe(false);
    expect(invalid.fotos).toBe(true);
  });
});
