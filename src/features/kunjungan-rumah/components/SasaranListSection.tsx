import type { KunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import type { KunjunganRumahAction, KunjunganRumahState } from "@/features/kunjungan-rumah/store/kunjunganRumahReducer";
import { SasaranForm } from "./SasaranForm";

interface Props {
  state: KunjunganRumahState;
  templates: KunjunganRumahTemplates;
  dispatch: React.Dispatch<KunjunganRumahAction>;
  bahaCount: number;
}

export function SasaranListSection({ state, templates, dispatch, bahaCount }: Props) {
  return (
    <div>
      {state.penilaian.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-line p-4 text-center text-[13px] text-muted">Belum ada sasaran dipilih di form anggota keluarga.</div>
      ) : (
        <div className="grid gap-4">
          {state.penilaian.map((p) => (
            <SasaranForm key={p.id} p={p} state={state} templates={templates} dispatch={dispatch} />
          ))}
        </div>
      )}
      <span className="sr-only">{bahaCount} tanda bahaya</span>
    </div>
  );
}
