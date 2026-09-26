import type { KunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import { Input } from "@/components/atoms/Input";
import { RadioCard } from "@/components/atoms/RadioCard";
import { FormField } from "@/components/molecules/FormField";
import { hasilKind, HASIL_KIND_LABEL } from "@/lib/hasil";
import type { KunjunganRumahAction, KunjunganRumahState } from "@/features/kunjungan-rumah/store/kunjunganRumahReducer";

interface Props {
  state: KunjunganRumahState;
  templates: KunjunganRumahTemplates;
  dispatch: React.Dispatch<KunjunganRumahAction>;
}

export function HasilSection({ state, templates, dispatch }: Props) {
  const hasilOpsi = templates.hasilOpsi;
  const kind = hasilKind(state.hasil);
  const jadwalWajib = kind === "jadwal";

  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        {hasilOpsi.map((h) => (
          <RadioCard key={h} title={h} description={HASIL_KIND_LABEL[hasilKind(h)]} inputProps={{ name: "hasil", checked: state.hasil === h, onChange: () => dispatch({ type: "SET_HASIL", value: h }) }} />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 max-md:grid-cols-1">
        <FormField label={jadwalWajib ? "Jadwal ulang" : "Jadwal kontrol berikutnya"} required={jadwalWajib} invalid={!!state.invalid.jadwal} error="Wajib isi jadwal." errorId="jadwal-error">
          <Input type="date" value={state.jadwal} onChange={(e) => dispatch({ type: "SET_JADWAL", value: e.target.value })} invalid={!!state.invalid.jadwal} aria-describedby={state.invalid.jadwal ? "jadwal-error" : undefined} />
        </FormField>
        <FormField label="TTD / nama jelas kader" required invalid={!!state.invalid.ttd} error="Wajib diisi." errorId="ttd-error">
          <Input value={state.ttd} onChange={(e) => dispatch({ type: "SET_TTD", value: e.target.value })} placeholder="cth. Siti Aminah" invalid={!!state.invalid.ttd} aria-describedby={state.invalid.ttd ? "ttd-error" : undefined} />
        </FormField>
      </div>
      {state.invalid.hasil ? (
        <span className="mt-2 block text-[11px] font-semibold text-danger">Pilih salah satu hasil kunjungan rumah.</span>
      ) : null}
    </>
  );
}