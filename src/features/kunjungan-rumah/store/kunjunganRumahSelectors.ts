import type { KunjunganRumahState } from "./kunjunganRumahReducer";
import type { KunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import { computeBahaCount, computeFillPercent, computeStepState } from "@/features/kunjungan-rumah/services/progress";

export function selectFillPercent(state: KunjunganRumahState, templates: KunjunganRumahTemplates): number {
  return computeFillPercent({ ...state, templates });
}
export function selectBahaCount(state: KunjunganRumahState): number {
  return computeBahaCount(state.penilaian);
}
export function selectStepState(state: KunjunganRumahState) {
  return computeStepState(state);
}
