/** Upload dokumentasi ke Supabase Storage bucket `dokumentasi` (publik, anon via PIN-gate app).
 *  Dipakai sebelum simpan record — DB hanya menyimpan fileUrl, bukan base64.
 */
const BUCKET = "dokumentasi";

function env(name: string): string {
  const v = (import.meta as unknown as { env: Record<string, string> }).env[name];
  if (!v) throw new Error(`${name} belum diisi`);
  return v;
}

function objectPath(prefix: string, name: string): string {
  const safe = name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-80) || "foto.jpg";
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}/${Date.now()}-${id}-${safe}`;
}

async function putObject(path: string, body: Blob, contentType: string): Promise<string> {
  const base = env("VITE_SUPABASE_URL").replace(/\/$/, "");
  const anon = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  const res = await fetch(`${base}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      "Content-Type": contentType,
    },
    body,
  });
  if (!res.ok) throw new Error(`Upload foto gagal (${res.status})`);
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; type: string } {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error("Format foto tidak valid");
  const type = m[1] || "image/jpeg";
  const bin = atob(m[3] ?? "");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { blob: new Blob([bytes], { type }), type };
}

/** Upload satu dataUrl terkompresi → URL publik. */
export async function uploadDataUrl(dataUrl: string, prefix = "kunjungan-rumah"): Promise<string> {
  const { blob, type } = dataUrlToBlob(dataUrl);
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  return putObject(objectPath(prefix, `foto.${ext}`), blob, type);
}

/** Upload File langsung (kegiatan) → URL publik. */
export async function uploadFile(file: File, prefix = "kegiatan"): Promise<string> {
  return putObject(objectPath(prefix, file.name), file, file.type || "image/jpeg");
}
