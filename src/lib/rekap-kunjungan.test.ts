import { describe, expect, it } from "vitest";
import {
  ageOn,
  computeRekap,
  kaderNameOf,
  mingguKe,
  rekapScopeId,
  sasaranGroup,
} from "./rekap-kunjungan";
import type { KunjunganRecord } from "@/features/checklist/types";
import type { AnggotaKeluarga, KeluargaInfo, MasalahTindak, PenilaianForm, Sanitasi } from "@/features/checklist/models";
import type { SasaranKey } from "./kr-form";
import { seedKrTemplates } from "./kr-templates";

interface RecOver {
  id?: string;
  tgl: string;
  ttd?: string;
  info?: Partial<KeluargaInfo>;
  sanitasi?: Partial<Sanitasi>;
  anggota?: AnggotaKeluarga[];
  penilaian?: PenilaianForm[];
  masalah?: MasalahTindak[];
}

function makeRecord(over: RecOver): KunjunganRecord {
  return {
    id: over.id ?? "r1",
    schemaVersion: 17,
    clientId: "c1",
    syncedAt: null,
    waktuSimpan: "2026-03-02T01:00:00.000Z",
    info: {
      tglPengumpulan: over.tgl,
      posyandu: over.info?.posyandu ?? "Melati 1",
      kelurahan: over.info?.kelurahan ?? "Trajeng",
      kecamatan: "",
      kabKota: "",
      provinsi: "",
      puskesmas: "",
      pustu: "",
      namaKK: "KK",
      alamat: "",
      hpKK: "",
      ...over.info,
    },
    sanitasi: { jkn: false, airBersih: false, jenisAir: "", jamban: false, jambanSaniter: "", jenisSumberAir: "", ventilasi: false, odgj: false, tbc: false, hipertensi: false, dm: false, ...over.sanitasi },
    anggota: over.anggota ?? [],
    penilaian: over.penilaian ?? [],
    masalah: over.masalah ?? [],
    hasil: "Selesai — sehat / terkendali",
    jadwal: "",
    ttd: over.ttd ?? "",
    fotos: [],
  };
}

function penilaian(anggotaId: string, sasaran: SasaranKey, values: Record<string, string> = {}, checks: Record<string, boolean> = {}): PenilaianForm {
  return { id: `p-${anggotaId}-${sasaran}`, anggotaId, sasaran, values, checks, prioritas: [] };
}

describe("mingguKe", () => {
  it("menghitung minggu dalam bulan (1-5)", () => {
    expect(mingguKe("2026-03-01")).toBe(1);
    expect(mingguKe("2026-03-07")).toBe(1);
    expect(mingguKe("2026-03-08")).toBe(2);
    expect(mingguKe("2026-03-15")).toBe(3);
    expect(mingguKe("2026-03-22")).toBe(4);
    expect(mingguKe("2026-03-30")).toBe(5);
  });
});

describe("ageOn", () => {
  it("menghitung umur pada tanggal acuan", () => {
    expect(ageOn("2010-03-10", "2026-03-01")).toBe(15);
    expect(ageOn("1975-06-01", "2026-03-01")).toBe(50);
    expect(ageOn("2020-03-01", "2026-03-01")).toBe(6);
    expect(ageOn("bukan-date", "2026-03-01")).toBeNull();
  });
});

describe("sasaranGroup", () => {
  it("memetakan sasaran biasa ke grup umur", () => {
    expect(sasaranGroup({ sasaran: "ibu-hamil" })).toBe("ibuHamil");
    expect(sasaranGroup({ sasaran: "bayi" })).toBe("bayiApras");
    expect(sasaranGroup({ sasaran: "remaja" })).toBe("sekolahRemaja");
    expect(sasaranGroup({ sasaran: "dewasa" })).toBe("produktif");
    expect(sasaranGroup({ sasaran: "lansia" })).toBe("lansia");
  });

  it("tbc dikelompokkan lewat umur; tanpa umur → produktif", () => {
    expect(sasaranGroup({ sasaran: "tbc" }, 3)).toBe("bayiApras");
    expect(sasaranGroup({ sasaran: "tbc" }, 15)).toBe("sekolahRemaja");
    expect(sasaranGroup({ sasaran: "tbc" }, 50)).toBe("produktif");
    expect(sasaranGroup({ sasaran: "tbc" }, 70)).toBe("lansia");
    expect(sasaranGroup({ sasaran: "tbc" }, null)).toBe("produktif");
  });
});

describe("rekapScopeId", () => {
  it("menghasilkan id scope unik", () => {
    expect(rekapScopeId()).toBe("all");
    expect(rekapScopeId("Trajeng")).toBe("Trajeng||");
    expect(rekapScopeId("Trajeng", "Melati 1", "Siti Aminah")).toBe("Trajeng|Melati 1|Siti Aminah");
  });
});

describe("kaderNameOf", () => {
  const staff = [{ nama: "Siti Aminah", peran: "Kader", kel: "Trajeng", posy: "Melati 1", hp: "", username: "siti.aminah", password: "admin123", on: true }];

  it("cocokkan lewat tanda tangan dulu", () => {
    const r = makeRecord({ tgl: "2026-03-02", ttd: "Siti Aminah" });
    expect(kaderNameOf(r, staff)).toBe("Siti Aminah");
  });

  it("fallback cocok wilayah", () => {
    const r = makeRecord({ tgl: "2026-03-02", ttd: "", info: { posyandu: "Melati 1", kelurahan: "Trajeng" } });
    expect(kaderNameOf(r, staff)).toBe("Siti Aminah");
  });

  it("null bila tak cocok", () => {
    const r = makeRecord({ tgl: "2026-03-02", ttd: "", info: { posyandu: "Kenanga", kelurahan: "Tambaan" } });
    expect(kaderNameOf(r, staff)).toBeUndefined();
  });
});

describe("computeRekap", () => {
  const templates = seedKrTemplates();
  const ref = "2026-03-01";

  it("menghitung keluarga & sasaran per minggu", () => {
    const rec = makeRecord({
      tgl: "2026-03-03",
      anggota: [
        { id: "a1", nama: "Ana", nik: "1".repeat(16), tglLahir: "1990-01-01", jk: "P", hubKK: "", statusKawin: "", pendidikan: "", pekerjaan: "" },
      ],
      penilaian: [penilaian("a1", "ibu-hamil", { k1Tanggal: "2026-02-01" })],
    });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows).toHaveLength(1);
    const row = res.rows[0]!;
    expect(row.minggu).toBe(1);
    expect(row.auto.keluarga).toBe(1);
    expect(row.auto.sasaran.ibuHamil).toBe(1);
  });

  it("dua kunjungan keluarga sama minggu → keluarga = 2", () => {
    const r1 = makeRecord({ id: "x1", tgl: "2026-03-03", penilaian: [penilaian("a1", "remaja")] });
    const r2 = makeRecord({ id: "x2", tgl: "2026-03-05", penilaian: [penilaian("a1", "lansia")] });
    const res = computeRekap([r1, r2], templates, { month: "2026-03", ref });
    expect(res.rows[0]!.auto.keluarga).toBe(2);
    expect(res.rows[0]!.auto.sasaran.sekolahRemaja).toBe(1);
    expect(res.rows[0]!.auto.sasaran.lansia).toBe(1);
  });

  it("tbc dikelompokkan ke produktif via umur", () => {
    const rec = makeRecord({
      tgl: "2026-03-03",
      anggota: [{ id: "a1", nama: "Tn. X", nik: "1".repeat(16), tglLahir: "1975-05-01", jk: "L", hubKK: "", statusKawin: "", pendidikan: "", pekerjaan: "" }],
      penilaian: [penilaian("a1", "tbc")],
    });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows[0]!.auto.sasaran.produktif).toBe(1);
  });

  it("tanda bahaya dihitung dari checkbox Baha", () => {
    const rec = makeRecord({
      tgl: "2026-03-03",
      penilaian: [penilaian("a1", "ibu-hamil", {}, { demam: true })],
    });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows[0]!.auto.masalahIbuTandaBahaya).toBe(1);
  });

  it("tidak akses pelayanan = tanpa tanggal K", () => {
    const rec = makeRecord({
      tgl: "2026-03-03",
      penilaian: [penilaian("a1", "ibu-hamil")],
    });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows[0]!.auto.masalahIbuTidakAkses).toBe(1);
  });

  it("akses pelayanan terisi → tidak dihitung masalah akses", () => {
    const rec = makeRecord({
      tgl: "2026-03-03",
      penilaian: [penilaian("a1", "ibu-hamil", { k1Tanggal: "2026-02-01" })],
    });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows[0]!.auto.masalahIbuTidakAkses).toBe(0);
  });

  it("tidak minum obat teratur = ada obat tapi tidak minum 24 jam", () => {
    const rec = makeRecord({
      tgl: "2026-03-03",
      penilaian: [penilaian("a1", "dewasa", { tdPeriksaSetahunTanggal: "2026-01-01" }, { tdAdaObat: true, tdMinum24: false })],
      info: { posyandu: "Melati 1", kelurahan: "Trajeng" },
    });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows[0]!.auto.masalahDewasaTidakMinumObat).toBe(1);
  });

  it("bergejala TBC via sanitasi.tbc keluarga", () => {
    const rec = makeRecord({
      tgl: "2026-03-03",
      sanitasi: { tbc: true },
      penilaian: [penilaian("a1", "dewasa", { tdPeriksaSetahunTanggal: "2026-01-01" })],
    });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows[0]!.auto.masalahDewasaBergejalaTbc).toBe(1);
  });

  it("tindak lanjut edukasi & lapor nakes dari tanggal", () => {
    const rec = makeRecord({
      tgl: "2026-03-03",
      penilaian: [
        penilaian("a1", "ibu-hamil", { edukasiNakesTanggal: "2026-03-03", laporNakesTanggal: "2026-03-03" }),
        penilaian("a2", "lansia", { edukasiNakesMateri: "Gizi" }),
      ],
    });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows[0]!.auto.tindakEdukasi).toBe(2);
    expect(res.rows[0]!.auto.tindakLaporNakes).toBe(1);
  });

  it("filter kelurahan, posyandu, dan kader", () => {
    const staff = [
      { nama: "Siti Aminah", peran: "Kader", kel: "Trajeng", posy: "Melati 1", hp: "", username: "siti.aminah", password: "admin123", on: true },
      { nama: "Budi", peran: "Kader", kel: "Tambaan", posy: "Mawar 2", hp: "", username: "budi", password: "admin123", on: true },
    ];
    const rTrajeng = makeRecord({ id: "t1", tgl: "2026-03-03", ttd: "Siti Aminah", info: { posyandu: "Melati 1", kelurahan: "Trajeng" }, penilaian: [penilaian("a1", "ibu-hamil")] });
    const rTambaan = makeRecord({ id: "m1", tgl: "2026-03-03", ttd: "Budi", info: { posyandu: "Mawar 2", kelurahan: "Tambaan" }, penilaian: [penilaian("a1", "remaja")] });

    const resKader = computeRekap([rTrajeng, rTambaan], templates, { month: "2026-03", kader: "Siti Aminah", staff, ref });
    expect(resKader.rows[0]!.auto.keluarga).toBe(1);
    expect(resKader.rows[0]!.auto.sasaran.ibuHamil).toBe(1);

    const resKel = computeRekap([rTrajeng, rTambaan], templates, { month: "2026-03", kel: "Tambaan", ref });
    expect(resKel.rows[0]!.auto.sasaran.sekolahRemaja).toBe(1);

    const resPosy = computeRekap([rTrajeng, rTambaan], templates, { month: "2026-03", posy: "Melati 1", ref });
    expect(resPosy.rows[0]!.auto.sasaran.ibuHamil).toBe(1);
  });

  it("bulan lain tidak ikut", () => {
    const rec = makeRecord({ tgl: "2026-02-03", penilaian: [penilaian("a1", "remaja")] });
    const res = computeRekap([rec], templates, { month: "2026-03", ref });
    expect(res.rows).toHaveLength(0);
  });
});