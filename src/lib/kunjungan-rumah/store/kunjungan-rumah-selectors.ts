import type { KunjunganRumahState } from './kunjungan-rumah-reducer'
import type { KunjunganRumahTemplates } from '@/lib/kunjungan-rumah/template/kunjungan-rumah-templates'
import {
  computeBahaCount,
  computeFillPercent,
  computeStepState,
} from '@/lib/service/kunjungan-rumah/progress'

export function selectFillPercent(
  state: KunjunganRumahState,
  templates: KunjunganRumahTemplates,
): number {
  return computeFillPercent({ ...state, templates })
}
export function selectBahaCount(state: KunjunganRumahState): number {
  return computeBahaCount(state.penilaian)
}
export function selectStepState(state: KunjunganRumahState) {
  return computeStepState(state)
}
