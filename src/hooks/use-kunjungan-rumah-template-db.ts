import { useCallback, useEffect, useState } from "react";
import { getKunjunganRumahTemplate } from "@/lib/utils.functions";
import { templateFromRows } from "@/features/kunjungan-rumah/lib/template-from-rows";
import type { KunjunganRumahTemplateRows } from "@/features/kunjungan-rumah/lib/template-from-rows";
import { createDefaultKunjunganRumahTemplates, validateKunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import type { KunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";

// Dibuat sekali di module scope, bukan di dalam hook: kalau dipanggil tiap render maka
// `refresh` ikut berubah tiap render dan useEffect di bawah jadi loop.
/** Definisi bawaan, dipakai kalau DB kosong atau gagal dibaca. */
const FALLBACK = createDefaultKunjunganRumahTemplates();

/** Template form dari DB; jatuh ke `FALLBACK` supaya form tidak blank saat DB bermasalah. */
export function useKunjunganRumahTemplateDb() {
  const [templates, setTemplates] = useState<KunjunganRumahTemplates>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"db" | "fallback">("fallback");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    let hasil: KunjunganRumahTemplates = FALLBACK;
    let sumber: "db" | "fallback" = "fallback";
    let pesan: string | null = null;

    try {
      const rows: KunjunganRumahTemplateRows | null = await getKunjunganRumahTemplate();
      if (!rows) {
        pesan = "Form kunjungan rumah belum ada di database, memakai definisi bawaan.";
      } else {
        // Hasil mapper divalidasi ulang dengan validator yang sama seperti localStorage,
        // supaya baris DB yang rusak tidak sampai jadi form yang tidak bisa diisi.
        const mapped = templateFromRows(rows);
        if (validateKunjunganRumahTemplates(mapped)) {
          hasil = mapped;
          sumber = "db";
        } else {
          pesan = "Definisi form dari database tidak valid, memakai definisi bawaan.";
        }
      }
    } catch (e) {
      // Pesan asli ikut ditampilkan: mapper dan server fn sudah menulis alasan yang
      // bisa ditindaklanjuti (mis. versi definisi tidak cocok).
      pesan = e instanceof Error ? e.message : "Gagal memuat definisi form dari database.";
    }

    setTemplates(hasil);
    setSource(sumber);
    setError(pesan);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { templates, loading, error, source, refresh };
}
