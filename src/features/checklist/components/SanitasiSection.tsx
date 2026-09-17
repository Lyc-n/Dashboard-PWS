import { Fragment, useMemo } from "react";
import type { KrTemplates } from "@/lib/kr-templates";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Select } from "@/components/atoms/Select";
import type { KunjunganAction, KunjunganState } from "../store/kunjunganReducer";

interface Props {
  state: KunjunganState;
  templates: KrTemplates;
  dispatch: React.Dispatch<KunjunganAction>;
}

export function SanitasiSection({ state, templates, dispatch }: Props) {
  const sanitasiFields = useMemo(() => templates.sanitasi.filter((f) => f.active).sort((a, b) => a.order - b.order), [templates.sanitasi]);
  const sanitasiChecks = useMemo(() => sanitasiFields.filter((f) => f.kind === "checkbox"), [sanitasiFields]);
  const sanitasiSelects = useMemo(() => sanitasiFields.filter((f) => f.kind === "select"), [sanitasiFields]);
  const sanitasiTpl = (id: string) => templates.sanitasi.find((f) => f.id === id);

  return (
    <div className="mt-6 grid gap-1.5">
      <span className="text-xs font-semibold text-ink">Sanitasi / lingkungan keluarga</span>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 max-md:grid-cols-2 max-sm:grid-cols-1">
        {sanitasiChecks.map((f) => {
          if (f.id === "jambanSaniter") return null;
          return (
            <Fragment key={f.id}>
              <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox
                  checked={Boolean((state.sanitasi as Record<string, unknown>)[f.id])}
                  onChange={(e) => {
                    if (f.id === "airBersih") {
                      dispatch({ type: "SET_SAN_FIELD", key: "airBersih", value: e.target.checked });
                      dispatch({ type: "SET_SAN_FIELD", key: e.target.checked ? "jenisSumberAir" : "jenisAir", value: "" });
                    } else if (f.id === "jamban") {
                      dispatch({ type: "SET_SAN_FIELD", key: "jamban", value: e.target.checked });
                      dispatch({ type: "SET_SAN_FIELD", key: "jambanSaniter", value: "" });
                    } else {
                      dispatch({ type: "SET_SAN_FIELD", key: f.id as never, value: e.target.checked });
                    }
                  }}
                />
                {f.label}
                {f.required ? <span className="text-danger">*</span> : null}
              </label>
              {f.id === "airBersih" && state.sanitasi.airBersih ? (
                <Select value={state.sanitasi.jenisAir} onChange={(e) => dispatch({ type: "SET_SAN_FIELD", key: "jenisAir", value: e.target.value })} className="max-w-44 py-1 text-xs">
                  <option value="">— Pilih —</option>
                  {(sanitasiTpl("jenisAir")?.options ?? ["Sumur terlindung", "Ledeng/PDAM", "Sumur pompa", "Mata air", "Tidak terlindung", "Lainnya"]).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              ) : f.id === "airBersih" ? (
                <Select value={state.sanitasi.jenisSumberAir} onChange={(e) => dispatch({ type: "SET_SAN_FIELD", key: "jenisSumberAir", value: e.target.value })} className="max-w-44 py-1 text-xs">
                  <option value="">— Pilih —</option>
                  {(sanitasiTpl("jenisSumberAir")?.options ?? ["Sumur terbuka", "Air sungai", "Danau / telaga"]).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              ) : null}
              {f.id === "jamban" ? (
                <Select value={state.sanitasi.jambanSaniter} onChange={(e) => dispatch({ type: "SET_SAN_FIELD", key: "jambanSaniter", value: e.target.value })} className="max-w-44 py-1 text-xs">
                  <option value="">— Pilih —</option>
                  {(state.sanitasi.jamban ? sanitasiTpl("jambanSaniter")?.options ?? ["Kloset", "Leher angsa", "Plengseran"] : ["Cemplung"]).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              ) : null}
            </Fragment>
          );
        })}
        {sanitasiSelects
          .filter((f) => !["jenisAir", "jenisSumberAir", "jambanSaniter"].includes(f.id))
          .map((f) => (
            <label key={f.id} className="flex items-center gap-2 text-[13px]">
              <span className="text-muted">{f.label}</span>
              <Select value={String((state.sanitasi as Record<string, unknown>)[f.id] ?? "")} onChange={(e) => dispatch({ type: "SET_SAN_FIELD", key: f.id as never, value: e.target.value })} className="max-w-44 py-1 text-xs">
                <option value="">— Pilih —</option>
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
