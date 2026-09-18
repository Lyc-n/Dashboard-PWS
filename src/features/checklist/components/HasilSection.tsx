import type { KrTemplates } from "@/lib/kr-templates";
import { Input } from "@/components/atoms/Input";
import { RadioCard } from "@/components/atoms/RadioCard";
import { FormField } from "@/components/molecules/FormField";
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
