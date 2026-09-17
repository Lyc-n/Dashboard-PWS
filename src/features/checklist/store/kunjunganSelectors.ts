import type { KunjunganState } from "./kunjunganReducer";
import type { KrTemplates } from "@/lib/kr-templates";
import { computeBahaCount, computeFillPercent, computeStepState } from "../services/progress";

export function selectFillPercent(state: KunjunganState, templates: KrTemplates): number {
  return computeFillPercent({ ...state, templates });
}
export function selectBahaCount(state: KunjunganState): number {
  return computeBahaCount(state.penilaian);
}
export function selectStepState(state: KunjunganState) {
  return computeStepState(state);
}
