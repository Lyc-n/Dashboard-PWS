import type { KrTemplates } from "@/lib/kr-templates";
import { Input } from "@/components/atoms/Input";
import { RadioCard } from "@/components/atoms/RadioCard";
import { ChipGroup } from "@/components/molecules/ChipGroup";
import { FormField } from "@/components/molecules/FormField";
import { PRIOS } from "@/lib/constants";
import type { KunjunganAction, KunjunganState } from "../store/kunjunganReducer";

interface Props {
  state: KunjunganState;
  templates: KrTemplates;
  dispatch: React.Dispatch<KunjunganAction>;
}

export function HasilSection({ state, templates, dispatch }: Props) {
  const hasilOpsi = templates.hasilOpsi;

  return (
    <>
      {state.penilaian.length > 0 ? (
        <div className="grid gap-3">
          {state.penilaian.map((p) => {
            const anggota = state.anggota.find((a) => a.id === p.anggotaId);
            const label = templates.sasaran[p.sasaran].label;
            return (
              <div key={p.id} className="rounded-[10px] border border-line bg-surface p-3">
                <div className="mb-2 text-xs font-semibold text-ink">{label} · {anggota?.nama || "—"}</div>
                <div className="text-[11px] text-muted">Prioritas program (drive dashboard):</div>
                <ChipGroup options={PRIOS.map((prio) => ({ value: prio, label: prio }))} selected={p.prioritas} onToggle={(v) => dispatch({ type: "TOGGLE_PRIORITAS", id: p.id, prio: v })} className="mt-1.5" />
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        {hasilOpsi.map((h) => (
          <RadioCard key={h} title={h} description={h === hasilOpsi[1] ? "Butuh jadwal ulang" : h === hasilOpsi[2] ? "Butuh rujukan" : "Tidak ada masalah berarti"} inputProps={{ name: "hasil", checked: state.hasil === h, onChange: () => dispatch({ type: "SET_HASIL", value: h }) }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <FormField label={state.hasil === hasilOpsi[1] ? "Jadwal ulang" : "Jadwal kontrol berikutnya"} required={state.hasil === hasilOpsi[1]} invalid={!!state.invalid.jadwal} error="Wajib isi jadwal." errorId="jadwal-error">
          <Input type="date" value={state.jadwal} onChange={(e) => dispatch({ type: "SET_JADWAL", value: e.target.value })} invalid={!!state.invalid.jadwal} aria-describedby={state.invalid.jadwal ? "jadwal-error" : undefined} />
        </FormField>
        <FormField label="TTD / nama jelas kader" required invalid={!!state.invalid.ttd} error="Wajib diisi." errorId="ttd-error">
          <Input value={state.ttd} onChange={(e) => dispatch({ type: "SET_TTD", value: e.target.value })} placeholder="cth. Siti Aminah" invalid={!!state.invalid.ttd} aria-describedby={state.invalid.ttd ? "ttd-error" : undefined} />
        </FormField>
      </div>
    </>
  );
}
