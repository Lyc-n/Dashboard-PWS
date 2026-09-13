import { useCallback } from "react";
import { STORAGE_KEYS } from "@/lib/constants";
import { seedKrTemplates, validateKrTemplates } from "@/lib/kr-templates";
import type { KrTemplates } from "@/lib/kr-templates";
import { useLocalStorage } from "@/lib/use-local-storage";

export function useKrTemplates() {
  const [templates, setTemplates] = useLocalStorage<KrTemplates>(STORAGE_KEYS.krTemplates, seedKrTemplates());

  const resetTemplates = useCallback(() => {
    setTemplates(seedKrTemplates());
  }, [setTemplates]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(templates, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `kr-templates-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [templates]);

  const importJson = useCallback(
    (file: File, onDone?: (ok: boolean, msg: string) => void) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (!validateKrTemplates(parsed)) throw new Error("Format template tidak valid (version harus 1).");
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
