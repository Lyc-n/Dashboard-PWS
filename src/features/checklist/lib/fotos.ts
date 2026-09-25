import type { KunjunganFoto } from "@/features/checklist/models";
import { createRecordId } from "@/features/checklist/types";

export const MAX_FOTO = 6;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
/** Total budget agar wrapper JSON muat di kuota localStorage (~5MB). */
export const MAX_TOTAL_BYTES = Math.floor(3.5 * 1024 * 1024);
const MAX_DIM = 1280;

export interface PrepareResult {
  added: KunjunganFoto[];
  skipped: number;
}

const BLOCKED_MIME = new Set(["image/svg+xml", "image/svg"]);

function isBlockedImage(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (BLOCKED_MIME.has(mime)) return true;
  return file.name.toLowerCase().endsWith(".svg");
}

function mimeOf(file: File): string {
  if (isBlockedImage(file)) return "";
  return file.type.startsWith("image/") ? file.type : "";
}

/** File -> dataUrl base64. Pakai arrayBuffer agar jalan di browser & node (test). */
export async function fileToDataUrl(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const base64 = typeof Buffer !== "undefined"
    ? Buffer.from(buf).toString("base64")
    : btoa(String.fromCharCode(...new Uint8Array(buf)));
  return `data:${file.type || "image/jpeg"};base64,${base64}`;
}

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

/** Kompres via canvas (browser saja). Di luar browser kembalikan asli. */
export function compressDataUrl(dataUrl: string): Promise<string> {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const out = canvas.toDataURL("image/jpeg", 0.7);
        resolve(out.length < dataUrl.length ? out : dataUrl);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Siapkan foto baru dari FileList: filter tipe/ukuran, kompres,
 * hormati batas jumlah & total byte. Murni async, tanpa state.
 */
export async function prepareFotos(existing: KunjunganFoto[], files: File[]): Promise<PrepareResult> {
  const added: KunjunganFoto[] = [];
  let skipped = 0;
  let total = existing.reduce((acc, f) => acc + dataUrlBytes(f.dataUrl), 0);

  for (const file of files) {
    if (existing.length + added.length >= MAX_FOTO) {
      skipped++;
      continue;
    }
    if (!mimeOf(file) || file.size > MAX_FILE_BYTES || file.size <= 0) {
      skipped++;
      continue;
    }
    const raw = await fileToDataUrl(file);
    const dataUrl = await compressDataUrl(raw);
    if (total + dataUrlBytes(dataUrl) > MAX_TOTAL_BYTES) {
      skipped++;
      continue;
    }
    total += dataUrlBytes(dataUrl);
    added.push({
      id: createRecordId(),
      name: file.name,
      dataUrl,
      caption: "",
      takenAt: new Date().toISOString(),
    });
  }
  return { added, skipped };
}
