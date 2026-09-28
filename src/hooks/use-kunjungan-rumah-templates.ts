import { useCallback } from "react";
import { KUNJUNGAN_RUMAH_TEMPLATE_VERSION } from "@/lib/kunjungan-rumah-templates";
import type { KunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import { useKunjunganRumahTemplateDb } from "@/hooks/use-kunjungan-rumah-template-db";
import { triggerDownload } from "@/lib/utils";

/**
 * Definisi form kunjungan rumah sekarang dibaca dari database, bukan localStorage.
 * Ekspor JSON tetap ada karena berguna sebagai backup, tapi semua jalur tulis
 * (set/reset/import) sengaja dimatikan sampai ada endpoint admin di server.
 * Mengganti definisi form lewat UI butuh tabel questions/form_field_options dan
 * validasi yang lebih besar dari sekadar menimpa satu blob JSON.
 */
export function useKunjunganRumahTemplates() {
  const { templates, loading, error, source, refresh } = useKunjunganRumahTemplateDb();

  const exportJson = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(`kunjungan-rumah-templates-${stamp}.json`, new Blob([JSON.stringify(templates, null, 2)], { type: "application/json" }));
  }, [templates]);

  const readOnly = useCallback((): never => {
    throw new Error("Definisi form hanya bisa diubah lewat database untuk sekarang.");
  }, []);

  const importJson = useCallback(
    (_file: File, onDone?: (ok: boolean, msg: string) => void) => {
      onDone?.(false, `Impor dinonaktifkan. Definisi form (version ${KUNJUNGAN_RUMAH_TEMPLATE_VERSION}) dikelola lewat database.`);
    },
    []
  );

  return {
    templates,
    loading,
    error,
    source,
    readOnly: true as const,
    refresh,
    exportJson,
    setTemplates: readOnly,
    resetTemplates: readOnly,
    importJson,
  };
}

export type { KunjunganRumahTemplates };
