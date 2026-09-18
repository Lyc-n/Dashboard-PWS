import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import type { KrTemplates } from "@/lib/kr-templates";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormField } from "@/components/molecules/FormField";
import type { KunjunganAction, KunjunganState } from "../store/kunjunganReducer";

interface Props {
  state: KunjunganState;
  templates: KrTemplates;
  dispatch: React.Dispatch<KunjunganAction>;
}

export function MasalahSection({ state, templates, dispatch }: Props) {
  const masalahFields = useMemo(() => templates.masalah.filter((f) => f.active).sort((a, b) => a.order - b.order), [templates.masalah]);

  // Sync otomatis: jika data anggota / info berubah, update masalah yang nama-nya match
  useEffect(() => {
    for (const m of state.masalah) {
      const agg = state.anggota.find((a) => a.nama === m.nama);
      if (!agg) continue;
      if (agg.nik !== m.nik) dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "nik", value: agg.nik });
      if (agg.tglLahir !== m.tglLahir) dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "tglLahir", value: agg.tglLahir });
      if (state.info.alamat !== m.alamat) dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "alamat", value: state.info.alamat });
      if (state.info.hpKK !== m.telepon) dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "telepon", value: state.info.hpKK });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(state.anggota), state.info.alamat, state.info.hpKK]);

  return (
    <div className="mt-4 grid gap-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink">Masalah & tindak lanjut (per sasaran)</span>
        <Button variant="ghost" onClick={() => dispatch({ type: "ADD_MASALAH" })}>+ Tambah masalah</Button>
      </div>
      <div className="grid gap-3">
        {state.masalah.map((m) => (
          <div key={m.id} className="rounded-[10px] border border-line bg-surface p-3">
            <div className="mb-2 flex items-center justify-end">
              <button type="button" onClick={() => dispatch({ type: "REMOVE_MASALAH", id: m.id })} className="text-muted hover:text-danger" aria-label="Hapus masalah">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              {masalahFields.map((f) => {
                const val = m[f.id] ?? "";
                const invalid = !!state.invalid[`masalah:${m.id}:${f.id}`];
                const errorId = `masalah:${m.id}:${f.id}-error`;
                if (f.id === "nama") {
                  return (
                    <FormField key={f.id} label={f.label} required={f.required} invalid={invalid} error="Wajib diisi." hint={f.hint} errorId={errorId}>
                      <Select value={val} onChange={(e) => {
                        const v = e.target.value;
                        const agg = state.anggota.find((a) => a.nama === v);
                        dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "nama", value: v });
                        if (agg) {
                          dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "nik", value: agg.nik });
                          dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "tglLahir", value: agg.tglLahir });
                          dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "alamat", value: state.info.alamat });
                          dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "telepon", value: state.info.hpKK });
                        } else {
                          dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "nik", value: "" });
                          dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "tglLahir", value: "" });
                          dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "alamat", value: "" });
                          dispatch({ type: "UPDATE_MASALAH", id: m.id, key: "telepon", value: "" });
                        }
                      }} aria-describedby={invalid ? errorId : undefined}>
                        <option value="">— Pilih anggota —</option>
                        {state.anggota.map((a) => (
                          <option key={a.id} value={a.nama}>{a.nama}</option>
                        ))}
                      </Select>
                    </FormField>
                  );
                }
                return (
                  <FormField key={f.id} label={f.label} required={f.required} invalid={invalid} error="Wajib diisi." hint={f.hint} className={f.id === "masalah" || f.id === "tindakLanjut" ? "col-span-2" : ""} errorId={errorId}>
                    {f.kind === "date" ? (
                      <Input type="date" value={val} onChange={(e) => dispatch({ type: "UPDATE_MASALAH", id: m.id, key: f.id, value: e.target.value })} invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
                    ) : f.kind === "select" ? (
                      <Select value={val} onChange={(e) => dispatch({ type: "UPDATE_MASALAH", id: m.id, key: f.id, value: e.target.value })} aria-describedby={invalid ? errorId : undefined}>
                        <option value="">— Pilih —</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </Select>
                    ) : (
                      <Input value={val} onChange={(e) => dispatch({ type: "UPDATE_MASALAH", id: m.id, key: f.id, value: e.target.value })} placeholder={f.id === "masalah" ? "cth. Hipertensi tidak patuh berobat" : f.id === "tindakLanjut" ? "cth. Edukasi & jadwal kontrol" : ""} invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
                    )}
                  </FormField>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
