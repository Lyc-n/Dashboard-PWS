import { useAsyncData } from "@/hooks/use-async-data";
import { getKunjunganRumahTemplate } from "@/lib/utils.functions";
import { templateFromRows } from "@/features/kunjungan-rumah/lib/template-from-rows";
import type { KunjunganRumahTemplateRows } from "@/features/kunjungan-rumah/lib/template-from-rows";
import { createDefaultKunjunganRumahTemplates, validateKunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import type { KunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";

/** Definisi bawaan, dipakai kalau DB kosong atau gagal dibaca. */
const FALLBACK = createDefaultKunjunganRumahTemplates();

interface HasilTemplateDb {
  templates: KunjunganRumahTemplates;
  source: "db" | "fallback";
  pesan: string | null;
}

/** Template form dari DB; jatuh ke `FALLBACK` supaya form tidak blank saat DB bermasalah. */
export function useKunjunganRumahTemplateDb() {
  const { data, loading, error, reload } = useAsyncData<HasilTemplateDb>(
    async () => {
      const rows: KunjunganRumahTemplateRows | null = await getKunjunganRumahTemplate();
      if (!rows) {
        return {
          templates: FALLBACK,
          source: "fallback",
          pesan: "Form kunjungan rumah belum ada di database, memakai definisi bawaan.",
        };
      }
      // Hasil mapper divalidasi ulang dengan validator yang sama seperti localStorage,
      // supaya baris DB yang rusak tidak sampai jadi form yang tidak bisa diisi.
      const mapped = templateFromRows(rows);
      if (validateKunjunganRumahTemplates(mapped)) {
        return { templates: mapped, source: "db", pesan: null };
      }
      return {
        templates: FALLBACK,
        source: "fallback",
        pesan: "Definisi form dari database tidak valid, memakai definisi bawaan.",
      };
    },
    [],
    { templates: FALLBACK, source: "fallback", pesan: null },
    {
      cancel: false,
      // Pesan asli ikut ditampilkan: mapper dan server fn sudah menulis alasan yang
      // bisa ditindaklanjuti (mis. versi definisi tidak cocok).
      mapError: (e) => (e instanceof Error ? e.message : "Gagal memuat definisi form dari database."),
    },
  );

  return {
    templates: data.templates,
    loading,
    error: loading ? null : (error ?? data.pesan),
    source: data.source,
    refresh: reload,
  };
}
