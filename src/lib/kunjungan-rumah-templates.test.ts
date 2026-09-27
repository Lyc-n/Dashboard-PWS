import { describe, expect, it } from "vitest";
import { KUNJUNGAN_RUMAH_TEMPLATE_VERSION, createDefaultKunjunganRumahTemplates, validateKunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";

describe("validateKunjunganRumahTemplates", () => {
  it("terima hasil createDefaultKunjunganRumahTemplates", () => {
    expect(validateKunjunganRumahTemplates(createDefaultKunjunganRumahTemplates())).toBe(true);
  });

  it("tolak version salah", () => {
    expect(validateKunjunganRumahTemplates({ ...createDefaultKunjunganRumahTemplates(), version: 999 })).toBe(false);
    expect(validateKunjunganRumahTemplates(null)).toBe(false);
    expect(validateKunjunganRumahTemplates({})).toBe(false);
  });

  it("tolak id duplikat", () => {
    const tpl = createDefaultKunjunganRumahTemplates();
    const first = tpl.keluargaInfo[0];
    expect(first).toBeDefined();
    tpl.keluargaInfo.push({ ...first! });
    expect(validateKunjunganRumahTemplates(tpl)).toBe(false);
  });

  it("tolak select tanpa opsi", () => {
    const tpl = createDefaultKunjunganRumahTemplates();
    const sel = tpl.anggota.find((f) => f.kind === "select");
    expect(sel).toBeDefined();
    sel!.options = [];
    expect(validateKunjunganRumahTemplates(tpl)).toBe(false);
  });

  it("tolak hasilOpsi kosong", () => {
    expect(validateKunjunganRumahTemplates({ ...createDefaultKunjunganRumahTemplates(), hasilOpsi: [] })).toBe(false);
  });

  it("tolak kind/section tak dikenal", () => {
    const tpl = createDefaultKunjunganRumahTemplates();
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

  it("KUNJUNGAN_RUMAH_TEMPLATE_VERSION sinkron dengan default", () => {
    expect(createDefaultKunjunganRumahTemplates().version).toBe(KUNJUNGAN_RUMAH_TEMPLATE_VERSION);
  });
});
