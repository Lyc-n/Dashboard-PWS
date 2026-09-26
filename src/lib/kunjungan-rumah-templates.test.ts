import { describe, expect, it } from "vitest";
import { KUNJUNGAN_RUMAH_TEMPLATE_VERSION, seedKunjunganRumahTemplates, validateKunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";

describe("validateKunjunganRumahTemplates", () => {
  it("terima hasil seedKunjunganRumahTemplates", () => {
    expect(validateKunjunganRumahTemplates(seedKunjunganRumahTemplates())).toBe(true);
  });

  it("tolak version salah", () => {
    expect(validateKunjunganRumahTemplates({ ...seedKunjunganRumahTemplates(), version: 999 })).toBe(false);
    expect(validateKunjunganRumahTemplates(null)).toBe(false);
    expect(validateKunjunganRumahTemplates({})).toBe(false);
  });

  it("tolak id duplikat", () => {
    const tpl = seedKunjunganRumahTemplates();
    const first = tpl.keluargaInfo[0];
    expect(first).toBeDefined();
    tpl.keluargaInfo.push({ ...first! });
    expect(validateKunjunganRumahTemplates(tpl)).toBe(false);
  });

  it("tolak select tanpa opsi", () => {
    const tpl = seedKunjunganRumahTemplates();
    const sel = tpl.anggota.find((f) => f.kind === "select");
    expect(sel).toBeDefined();
    sel!.options = [];
    expect(validateKunjunganRumahTemplates(tpl)).toBe(false);
  });

  it("tolak hasilOpsi kosong", () => {
    expect(validateKunjunganRumahTemplates({ ...seedKunjunganRumahTemplates(), hasilOpsi: [] })).toBe(false);
  });

  it("tolak kind/section tak dikenal", () => {
    const tpl = seedKunjunganRumahTemplates();
    tpl.masalah.push({
      id: "x",
      label: "X",
      kind: "video",
      section: "masalah",
      required: false,
      active: true,
      order: 99,
    } as unknown as (typeof tpl.masalah)[number]);
    expect(validateKunjunganRumahTemplates(tpl)).toBe(false);
  });

  it("KUNJUNGAN_RUMAH_TEMPLATE_VERSION sinkron dengan seed", () => {
    expect(seedKunjunganRumahTemplates().version).toBe(KUNJUNGAN_RUMAH_TEMPLATE_VERSION);
  });
});
