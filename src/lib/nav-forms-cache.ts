import { listFormulirForNav } from "@/lib/utils.functions";
import type { BarisFormulirTerisi } from "@/features/survey/services/form-runtime.server";
import { subscribe, emit } from "./events";

const CACHE_TTL = 5 * 60 * 1000;

let cache: { data: BarisFormulirTerisi[]; expires: number } | null = null;
let inflight: Promise<BarisFormulirTerisi[]> | null = null;

async function fetchNavForms(): Promise<BarisFormulirTerisi[]> {
  const result = await listFormulirForNav();
  return result;
}

export async function getNavForms(): Promise<BarisFormulirTerisi[]> {
  const now = Date.now();
  if (cache && cache.expires > now) return cache.data;
  if (!inflight) inflight = fetchNavForms();
  const data = await inflight;
  inflight = null;
  cache = { data, expires: now + CACHE_TTL };
  return data;
}

export function invalidateNavForms(): void {
  cache = null;
  inflight = null;
  emit();
}

export function onNavFormsChange(listener: () => void): () => void {
  return subscribe(listener);
}