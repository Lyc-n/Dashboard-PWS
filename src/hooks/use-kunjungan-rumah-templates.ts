import { useCallback, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { KUNJUNGAN_RUMAH_TEMPLATE_VERSION, seedKunjunganRumahTemplates, validateKunjunganRumahTemplates  } from "@/lib/kunjungan-rumah-templates";
import type {KunjunganRumahTemplates} from "@/lib/kunjungan-rumah-templates";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { triggerDownload } from "@/lib/utils";

export function useKunjunganRumahTemplates() {
  const [templates, setTemplates] = useLocalStorage<KunjunganRumahTemplates>(STORAGE_KEYS.kunjunganRumahTemplates, seedKunjunganRumahTemplates());

  useEffect(() => {
    // Migrasi sekali dari kunci lama `pws-kr-templates` (pra-rename) bila kunci baru belum ada.
    try {
      const rawOld = localStorage.getItem("pws-kr-templates");
      const rawNew = localStorage.getItem(STORAGE_KEYS.kunjunganRumahTemplates);
      if (rawOld && !rawNew) {
        const parsed = JSON.parse(rawOld);
        if (validateKunjunganRumahTemplates(parsed)) {
          setTemplates(parsed);
          return;
        }
      }
    } catch {
      // abaikan — fallback ke validasi di bawah
    }
    // validateKunjunganRumahTemplates sudah cek version + shape; cukup satu guard
    if (!validateKunjunganRumahTemplates(templates)) {
      setTemplates(seedKunjunganRumahTemplates());
    }
  }, [templates, setTemplates]);

  const resetTemplates = useCallback(() => {
    setTemplates(seedKunjunganRumahTemplates());
  }, [setTemplates]);

  const exportJson = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(`kunjungan-rumah-templates-${stamp}.json`, new Blob([JSON.stringify(templates, null, 2)], { type: "application/json" }));
  }, [templates]);

  const importJson = useCallback(
    (file: File, onDone?: (ok: boolean, msg: string) => void) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!validateKunjunganRumahTemplates(parsed)) throw new Error(`Format template tidak valid (version harus ${KUNJUNGAN_RUMAH_TEMPLATE_VERSION}).`);
          setTemplates(parsed);
          onDone?.(true, "Template berhasil diimpor.");
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Gagal impor JSON.";
          onDone?.(false, msg);
        }
      };
      reader.onerror = () => onDone?.(false, "Gagal baca file.");
      reader.readAsText(file);
    },
    [setTemplates],
  );

  return { templates, setTemplates, resetTemplates, exportJson, importJson };
}
