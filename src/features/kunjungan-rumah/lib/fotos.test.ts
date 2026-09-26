import { describe, expect, it } from "vitest";
import { MAX_FOTO, fileToDataUrl, prepareFotos } from "@/features/kunjungan-rumah/lib/fotos";
import type { KunjunganRumahFoto } from "@/features/kunjungan-rumah/models";

function jpg(name: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type: "image/jpeg" });
}

const existingFoto: KunjunganRumahFoto = {
  id: "f0",
  name: "lama.jpg",
  dataUrl: "data:image/jpeg;base64,AAA",
  caption: "",
  takenAt: "2026-02-14T08:00:00.000Z",
};

describe("fileToDataUrl", () => {
  it("encode File menjadi dataUrl base64", async () => {
    const url = await fileToDataUrl(jpg("a.jpg", 10));
    expect(url.startsWith("data:image/jpeg;base64,")).toBe(true);
  });
});

describe("prepareFotos", () => {
  it("tambah foto valid dengan id dan takenAt", async () => {
    const { added, skipped } = await prepareFotos([], [jpg("a.jpg", 100)]);
    expect(skipped).toBe(0);
    expect(added).toHaveLength(1);
    expect((added[0]?.dataUrl ?? "").startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(added[0]?.name).toBe("a.jpg");
  });

  it("lewati bukan-gambar dan file >2MB", async () => {
    const txt = new File(["halo"], "a.txt", { type: "text/plain" });
    const big = jpg("big.jpg", 2 * 1024 * 1024 + 1);
    const { added, skipped } = await prepareFotos([], [txt, big]);
    expect(added).toHaveLength(0);
    expect(skipped).toBe(2);
  });

  it("hormati batas maks 6 foto termasuk yang sudah ada", async () => {
    const existing = Array.from({ length: MAX_FOTO }, (_, i) => ({ ...existingFoto, id: `f${i}` }));
    const { added, skipped } = await prepareFotos(existing, [jpg("baru.jpg", 100)]);
    expect(added).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it("lewati saat total byte melebihi budget", async () => {
    const huge: KunjunganRumahFoto = {
      ...existingFoto,
      dataUrl: `data:image/jpeg;base64,${"A".repeat(5 * 1024 * 1024)}`,
    };
    const { added, skipped } = await prepareFotos([huge], [jpg("baru.jpg", 100)]);
    expect(added).toHaveLength(0);
    expect(skipped).toBe(1);
  });
});
