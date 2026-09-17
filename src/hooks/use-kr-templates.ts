import { useCallback, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { seedKrTemplates, validateKrTemplates  } from "@/lib/kr-templates";
import type {KrTemplates} from "@/lib/kr-templates";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { triggerDownload } from "@/lib/utils";

export function useKrTemplates() {
  const [templates, setTemplates] = useLocalStorage<KrTemplates>(STORAGE_KEYS.krTemplates, seedKrTemplates());

  useEffect(() => {
    if ((templates as unknown as { version: number }).version !== 17) {
      setTemplates(seedKrTemplates());
    }
  }, [templates, setTemplates]);

  const resetTemplates = useCallback(() => {
    setTemplates(seedKrTemplates());
  }, [setTemplates]);

  const exportJson = useCallback(() => {
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(`kr-templates-${stamp}.json`, new Blob([JSON.stringify(templates, null, 2)], { type: "application/json" }));
  }, [templates]);

  const importJson = useCallback(
    (file: File, onDone?: (ok: boolean, msg: string) => void) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!validateKrTemplates(parsed)) throw new Error("Format template tidak valid (version harus 17).");
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
