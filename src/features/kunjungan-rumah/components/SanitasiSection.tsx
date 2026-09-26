import { useMemo } from "react";
import type { KunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import { sanField } from "@/features/kunjungan-rumah/models";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Select } from "@/components/atoms/Select";
import type { KunjunganRumahAction, KunjunganRumahState } from "@/features/kunjungan-rumah/store/kunjunganRumahReducer";

interface Props {
  state: KunjunganRumahState;
  templates: KunjunganRumahTemplates;
  dispatch: React.Dispatch<KunjunganRumahAction>;
}

export function SanitasiSection({ state, templates, dispatch }: Props) {
  const sanitasiFields = useMemo(() => templates.sanitasi.filter((f) => f.active).sort((a, b) => a.order - b.order), [templates.sanitasi]);
  const sanitasiChecks = useMemo(() => sanitasiFields.filter((f) => f.kind === "checkbox"), [sanitasiFields]);
  const sanitasiSelects = useMemo(() => sanitasiFields.filter((f) => f.kind === "select"), [sanitasiFields]);

  return (
    <div className="mt-6 grid gap-1.5">
      <span className="text-xs font-semibold text-ink">Sanitasi / lingkungan keluarga</span>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 max-md:grid-cols-2 max-sm:grid-cols-1">
        {sanitasiChecks.map((f) => {
          if (f.id === "jambanSaniter" || f.id === "airBersih" || f.id === "jamban") return null;
          return (
            <label key={f.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox
                  checked={Boolean(sanField(state.sanitasi, f.id))}
                  onChange={(e) => {
                    dispatch({ type: "SET_SAN_FIELD", key: f.id, value: e.target.checked });
                  }}
                />
                {f.label}
                {f.required ? <span className="text-danger">*</span> : null}
              </label>
          );
        })}
        {sanitasiSelects.map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-[13px]">
              <Select value={String(sanField(state.sanitasi, f.id))} onChange={(e) => dispatch({ type: "SET_SAN_FIELD", key: f.id, value: e.target.value })} className="max-w-44 py-1 text-xs">
                <option value="">{f.label || "— Pilih —"}</option>
                {(f.options ?? []).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </label>
          ))}
      </div>
    </div>
  );
}
