import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorageUploadError, uploadDataUrl } from "@/lib/supabase-storage";

const DATA_URL_JPEG = `data:image/jpeg;base64,${btoa("fake-bytes-18843")}`;
const FAKE_KEY = "test-publishable-key-tidak-rahasia";

function okResponse(): Response {
  return { ok: true, status: 200, statusText: "OK", text: async () => "" } as unknown as Response;
}

function errResponse(status: number, statusText: string, body: string): Response {
  return { ok: false, status, statusText, text: async () => body } as unknown as Response;
}

beforeEach(() => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", FAKE_KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("uploadDataUrl (mocked fetch)", () => {
  it("sukses → kembalikan URL publik tanpa bocor kunci", async () => {
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);
    const url = await uploadDataUrl(DATA_URL_JPEG, "kunjungan-rumah");
    expect(url).toContain("/storage/v1/object/public/dokumentasi/kunjungan-rumah/");
    expect(url).not.toContain(FAKE_KEY);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("image/jpeg");
  });

  it("HTTP error JSON → detail Supabase masuk pesan error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        errResponse(400, "Bad Request", JSON.stringify({ message: "Bucket not found" })),
      ),
    );
    const err = await uploadDataUrl(DATA_URL_JPEG).catch((e) => e);
    expect(err).toBeInstanceOf(StorageUploadError);
    expect((err as StorageUploadError).status).toBe(400);
    expect((err as Error).message).toContain("(400)");
    expect((err as Error).message).toContain("Bucket not found");
    expect((err as Error).message).not.toContain(FAKE_KEY);
  });

  it("HTTP error body tidak valid → tidak lempar saat parse, pakai teks mentah", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => errResponse(400, "Bad Request", "<html>bukan json")),
    );
    const err = await uploadDataUrl(DATA_URL_JPEG).catch((e) => e);
    expect(err).toBeInstanceOf(StorageUploadError);
    expect((err as StorageUploadError).status).toBe(400);
    expect((err as StorageUploadError).detail).toContain("bukan json");
  });

  it("network error → status 0 dengan penanda jaringan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    const err = await uploadDataUrl(DATA_URL_JPEG).catch((e) => e);
    expect(err).toBeInstanceOf(StorageUploadError);
    expect((err as StorageUploadError).status).toBe(0);
    expect((err as StorageUploadError).detail).toContain("fetch failed");
  });
});
