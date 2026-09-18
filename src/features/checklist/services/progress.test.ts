import { describe, expect, it } from "vitest";
import { seedKrTemplates } from "@/lib/kr-templates";
import { computeBahaCount, computeFillPercent, computeStepState } from "@/features/checklist/services/progress";
import type { AnggotaKeluarga, KeluargaInfo } from "@/features/checklist/models";

const templates = seedKrTemplates();

const emptyInfo = {
  tglPengumpulan: "",
  alamat: "",
  kelurahan: "",
  kecamatan: "",
  kabKota: "",
  provinsi: "",
  hpKK: "",
  puskesmas: "",
  pustu: "",
  posyandu: "",
  namaKK: "",
} satisfies KeluargaInfo;

const anggota: AnggotaKeluarga = {
  id: "a1",
  nama: "Budi Setiawan",
  nik: "3579015202800001",
  tglLahir: "1980-02-15",
  jk: "L",
  hubKK: "Anak",
  statusKawin: "Kawin",
  pendidikan: "SMA",
  pekerjaan: "Buruh",
};

describe("computeFillPercent", () => {
  it("0% saat form kosong", () => {
    const pct = computeFillPercent({
      info: { ...emptyInfo },
      anggota: [],
      penilaian: [],
      masalah: [],
      hasil: "",
      ttd: "",
      templates,
    });
    expect(pct).toBe(0);
  });

  it("100% saat semua wajib terisi", () => {
    const pct = computeFillPercent({
      info: { ...emptyInfo, tglPengumpulan: "2026-02-14", posyandu: "Mawar 2" },
      anggota: [anggota],
      penilaian: [{ id: "p1", anggotaId: "a1", sasaran: "dewasa", values: {}, checks: {}, prioritas: [] }],
      masalah: [],
      hasil: templates.hasilOpsi[0] ?? "",
      ttd: "Siti Aminah",
      templates,
    });
    expect(pct).toBe(100);
  });

  it("parsial di antara 0 dan 100", () => {
    const pct = computeFillPercent({
      info: { ...emptyInfo, tglPengumpulan: "2026-02-14" },
      anggota: [],
      penilaian: [],
      masalah: [],
      hasil: "",
      ttd: "",
      templates,
    });
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
});

describe("computeBahaCount", () => {
  it("hitung centang tanda bahaya sesuai definisi sasaran", () => {
    // ibu-hamil punya baha "demam"; dewasa/remaja/lansia memang tidak punya
    const n = computeBahaCount([
      { id: "p1", anggotaId: "a1", sasaran: "ibu-hamil", values: {}, checks: { demam: true, bukuKia: true }, prioritas: [] },
    ]);
    expect(n).toBe(1);
    expect(computeBahaCount([])).toBe(0);
    expect(
      computeBahaCount([
        { id: "p1", anggotaId: "a1", sasaran: "dewasa", values: {}, checks: { demam: true }, prioritas: [] },
      ]),
    ).toBe(0);
  });
});

describe("computeStepState", () => {
  it("alur now/done per progres", () => {
    expect(computeStepState({ anggota: [], penilaian: [], ttd: "" })).toEqual(["now", "todo", "todo"]);
    expect(computeStepState({ anggota: [anggota], penilaian: [], ttd: "" })).toEqual(["done", "now", "todo"]);
    expect(
      computeStepState({
        anggota: [anggota],
        penilaian: [{ id: "p1", anggotaId: "a1", sasaran: "dewasa", values: {}, checks: {}, prioritas: [] }],
        ttd: "",
      }),
    ).toEqual(["done", "done", "now"]);
    expect(
      computeStepState({
        anggota: [anggota],
        penilaian: [{ id: "p1", anggotaId: "a1", sasaran: "dewasa", values: {}, checks: {}, prioritas: [] }],
        ttd: "Siti",
      }),
    ).toEqual(["done", "done", "done"]);
  });
});
