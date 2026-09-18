import { describe, expect, it } from "vitest";
import { seedKrTemplates } from "@/lib/kr-templates";
import { validateKunjungan } from "@/features/checklist/services/validateKunjungan";
import type { ValidateInput } from "@/features/checklist/services/validateKunjungan";

const templates = seedKrTemplates();

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
    templates,
  };
}

describe("validateKunjungan", () => {
  it("lolos untuk isian minimal valid", () => {
    const { ok, invalid } = validateKunjungan(validInput());
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
    const { ok, invalid } = validateKunjungan(input);
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
    const dup = validateKunjungan(input);
    expect(dup.ok).toBe(false);
    expect(dup.invalid["nik:a2"]).toBe(true);

    const bad = validInput();
    bad.anggota[0]!.nik = "123";
    const res = validateKunjungan(bad);
    expect(res.ok).toBe(false);
    expect(res.invalid["nik:a1"]).toBe(true);
  });

  it("wajibkan jadwal saat hasil kontrol ulang", () => {
    const input = validInput();
    const kontrolUlang = templates.hasilOpsi[1];
    expect(kontrolUlang).toBeDefined();
    input.hasil = kontrolUlang as string;
    input.jadwal = "";
    expect(validateKunjungan(input).ok).toBe(false);
    input.jadwal = "2026-03-01";
    expect(validateKunjungan(input).ok).toBe(true);
  });

  it("tolak hasil di luar opsi template", () => {
    const input = validInput();
    input.hasil = "Hasil fiktif";
    const { ok, invalid } = validateKunjungan(input);
    expect(ok).toBe(false);
    expect(invalid.hasil).toBe(true);
  });
});
