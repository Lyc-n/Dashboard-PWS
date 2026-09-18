import { describe, expect, it } from "vitest";
import { KR_TEMPLATE_VERSION, seedKrTemplates, validateKrTemplates } from "@/lib/kr-templates";

describe("validateKrTemplates", () => {
  it("terima hasil seedKrTemplates", () => {
    expect(validateKrTemplates(seedKrTemplates())).toBe(true);
  });

  it("tolak version salah", () => {
    expect(validateKrTemplates({ ...seedKrTemplates(), version: 999 })).toBe(false);
    expect(validateKrTemplates(null)).toBe(false);
    expect(validateKrTemplates({})).toBe(false);
  });

  it("tolak id duplikat", () => {
    const tpl = seedKrTemplates();
    const first = tpl.keluargaInfo[0];
    expect(first).toBeDefined();
    tpl.keluargaInfo.push({ ...first! });
    expect(validateKrTemplates(tpl)).toBe(false);
  });

  it("tolak select tanpa opsi", () => {
    const tpl = seedKrTemplates();
    const sel = tpl.anggota.find((f) => f.kind === "select");
    expect(sel).toBeDefined();
    sel!.options = [];
    expect(validateKrTemplates(tpl)).toBe(false);
  });

  it("tolak hasilOpsi kosong", () => {
    expect(validateKrTemplates({ ...seedKrTemplates(), hasilOpsi: [] })).toBe(false);
  });

  it("tolak kind/section tak dikenal", () => {
    const tpl = seedKrTemplates();
    tpl.masalah.push({
      id: "x",
      label: "X",
      kind: "video",
      section: "masalah",
      required: false,
      active: true,
      order: 99,
    } as unknown as (typeof tpl.masalah)[number]);
    expect(validateKrTemplates(tpl)).toBe(false);
  });

  it("KR_TEMPLATE_VERSION sinkron dengan seed", () => {
    expect(seedKrTemplates().version).toBe(KR_TEMPLATE_VERSION);
  });
});
