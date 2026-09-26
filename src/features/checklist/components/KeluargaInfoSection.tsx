import { useEffect, useMemo, useState } from "react";
import type { KrTemplates } from "@/lib/kr-templates";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormField } from "@/components/molecules/FormField";
import { listSurveyors } from "#/lib/utils.functions";
import type { KunjunganAction, KunjunganState } from "../store/kunjunganReducer";

const PLACEHOLDER: Partial<Record<string, string>> = {
  alamat: "cth. Jl. Trajeng gg. II no. 8",
  hpKK: "cth. 62812xxxx",
  posyandu: "cth. Melati 1",
  puskesmas: "cth. Puskesmas Trajeng",
};

interface Props {
  state: KunjunganState;
  templates: KrTemplates;
  dispatch: React.Dispatch<KunjunganAction>;
}

export function KeluargaInfoSection({ state, templates, dispatch }: Props) {
  const keluargaInfoFields = useMemo(() => templates.keluargaInfo.filter((f) => f.active).sort((a, b) => a.order - b.order), [templates.keluargaInfo]);

  // [perbaikan] daftar petugas diambil dari DB saat mount — expect: opsi selalu sinkron tabel
  //   surveyor, bukan nama yang diketik manual; gagal fetch → daftar kosong, pilihan tetap kosong.
  const [petugas, setPetugas] = useState<{ id: string; nama: string }[]>([]);
  useEffect(() => {
    let hidup = true;
    void listSurveyors()
      .then((rows) => {
        if (hidup) setPetugas(rows);
      })
      .catch(() => {
        if (hidup) setPetugas([]);
      });
    return () => {
      hidup = false;
    };
  }, []);

  const petugasInvalid = !!state.invalid.petugasId;
  const petugasErrorId = "petugasId-error";

  return (
    <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
      {/* [perbaikan] dropdown Petugas hardcoded di luar field template — expect: tak hilang
          walau template Kelola diedit, dan nilainya menyimpan uuid surveyor (petugasId) + nama. */}
      <FormField label="Petugas" required invalid={petugasInvalid} error="Wajib diisi." errorId={petugasErrorId}>
        <Select
          value={state.info.petugasId}
          onChange={(e) => {
            const id = e.target.value;
            const nama = petugas.find((p) => p.id === id)?.nama ?? "";
            dispatch({ type: "SET_FIELD", key: "petugasId", value: id });
            dispatch({ type: "SET_FIELD", key: "petugasNama", value: nama });
          }}
          aria-describedby={petugasInvalid ? petugasErrorId : undefined}
        >
          <option value="">— Pilih Petugas —</option>
          {petugas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Select>
      </FormField>
      {keluargaInfoFields.map((f) => {
        const val = state.info[f.id] ?? "";
        const invalid = !!state.invalid[f.id] || (f.id === "tglPengumpulan" ? !!state.invalid.tgl : f.id === "posyandu" ? !!state.invalid.posyandu : false);
        const errorId = `${f.id}-error`;
        return (
          <FormField key={f.id} label={f.label} required={f.required} invalid={invalid} error={f.required ? "Wajib diisi." : undefined} hint={f.hint} errorId={errorId}>
            {f.kind === "date" ? (
              <Input type="date" value={val} onChange={(e) => dispatch({ type: "SET_FIELD", key: f.id, value: e.target.value })} invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
            ) : f.kind === "select" ? (
              <Select value={val} onChange={(e) => dispatch({ type: "SET_FIELD", key: f.id, value: e.target.value })} aria-describedby={invalid ? errorId : undefined}>
                <option value="">— Pilih —</option>
                {(f.options ?? []).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            ) : (
              <Input value={val} onChange={(e) => dispatch({ type: "SET_FIELD", key: f.id, value: e.target.value })} placeholder={PLACEHOLDER[f.id] ?? ""} invalid={invalid} aria-describedby={invalid ? errorId : undefined} />
            )}
          </FormField>
        );
      })}
    </div>
  );
}
