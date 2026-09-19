import { useCallback, useMemo, useState } from "react";
import { getKunjunganRepository } from "@/lib/repositories";
import { STORAGE_KEYS } from "@/lib/constants";
import { useKrTemplates } from "@/hooks/use-kr-templates";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { KunjunganRecord } from "@/features/checklist/types";

export type RekapField =
  | "keluarga"
  | "sasaranIbuHamil"
  | "sasaranBersalinNifas"
  | "sasaranBayiApras"
  | "sasaranSekolahRemaja"
  | "sasaranProduktif"
  | "sasaranLansia"
  | "masalahIbuTidakAkses"
  | "masalahIbuTandaBahaya"
  | "masalahDewasaTidakAdaPelayanan"
  | "masalahDewasaBergejalaTbc"
  | "masalahDewasaTidakMinumObat"
  | "tindakEdukasi"
  | "tindakLaporNakes"
  | "paraf";

export interface RekapOverride {
  id: string;
  scopeId: string;
  period: string; // "YYYY-MM"
  minggu: number;
  field: RekapField;
  value: string;
}

export interface RekapOverrideFilter {
  scopeId: string;
  period: string;
}

function overrideKey(f: RekapOverrideFilter): string {
  return `${f.scopeId}|${f.period}`;
}

function makeOverrideId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export function useRekapKunjungan() {
  const { templates } = useKrTemplates();
  const [records, setRecords] = useState<KunjunganRecord[]>(() => {
    try {
      return getKunjunganRepository().list();
    } catch {
      return [];
    }
  });
  const [overrides, setOverrides] = useLocalStorage<RekapOverride[]>(STORAGE_KEYS.rekap, []);

  const refresh = useCallback(() => {
    try {
      setRecords(getKunjunganRepository().list());
    } catch {
      setRecords([]);
    }
  }, []);

  const forScope = useCallback(
    (f: RekapOverrideFilter): RekapOverride[] => {
      const key = overrideKey(f);
      return overrides.filter((o) => `${o.scopeId}|${o.period}` === key);
    },
    [overrides],
  );

  const getValue = useCallback(
    (f: RekapOverrideFilter, minggu: number, field: RekapField): string | undefined => {
      const found = forScope(f).find((o) => o.minggu === minggu && o.field === field);
      return found?.value;
    },
    [forScope],
  );

  const setValue = useCallback(
    (f: RekapOverrideFilter, minggu: number, field: RekapField, value: string) => {
      setOverrides((prev) => {
        const next = prev.filter(
          (o) => !(`${o.scopeId}|${o.period}` === overrideKey(f) && o.minggu === minggu && o.field === field),
        );
        if (value === "" || (value === "0" && field !== "paraf")) return next;
        return [...next, { id: makeOverrideId(), scopeId: f.scopeId, period: f.period, minggu, field, value }];
      });
    },
    [setOverrides],
  );

  const clearScope = useCallback(
    (f: RekapOverrideFilter) => {
      setOverrides((prev) => prev.filter((o) => `${o.scopeId}|${o.period}` !== overrideKey(f)));
    },
    [setOverrides],
  );

  const hasOverrides = useMemo(() => overrides.length > 0, [overrides]);

  return {
    templates,
    records,
    refresh,
    overrides,
    forScope,
    getValue,
    setValue,
    clearScope,
    hasOverrides,
  };
}