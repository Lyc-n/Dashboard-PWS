import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { sasaranDef } from "@/lib/kr-form";
import type { KrTemplates } from "@/lib/kr-templates";
import { Checkbox } from "@/components/atoms/Checkbox";
import { ChipGroup } from "@/components/molecules/ChipGroup";
import { PRIOS } from "@/lib/constants";
import type { PenilaianForm } from "@/features/checklist/models";
import { isConditionalActive } from "../services/conditional";
import type { KunjunganAction, KunjunganState } from "../store/kunjunganReducer";
import { FieldCell } from "./FieldCell";

interface Props {
  p: PenilaianForm;
  state: KunjunganState;
  templates: KrTemplates;
  dispatch: React.Dispatch<KunjunganAction>;
}

export function SasaranForm({ p, state, templates, dispatch }: Props) {
  const tpl = templates.sasaran[p.sasaran];
  const label = tpl.label;
  const anggota = state.anggota.find((a) => a.id === p.anggotaId);
  const fields = useMemo(() => tpl.fields.filter((f) => f.active).sort((a, b) => a.order - b.order), [tpl.fields]);
  const rules = useMemo(() => sasaranDef(p.sasaran).conditionals ?? [], [p.sasaran]);
  const conditionalIds = useMemo(() => new Set(rules.flatMap((r) => r.dependents)), [rules]);
  const fieldMap = useMemo(() => new Map(fields.map((f) => [f.id, f] as const)), [fields]);

  const K1K6_IDS = useMemo(() => ["k1Tempat", "k1Tanggal", "k1Petugas", "k2Tempat", "k2Tanggal", "k2Petugas", "k3Tempat", "k3Tanggal", "k3Petugas", "k4Tempat", "k4Tanggal", "k4Petugas", "k5Tempat", "k5Tanggal", "k5Petugas", "k6Tempat", "k6Tanggal", "k6Petugas"], []);
  const EDUKASI_IDS = useMemo(() => ["edukasiNakesMateri", "edukasiNakesTanggal"], []);
  const SKRINING_IDS = useMemo(() => ["skriningJiwaTempat", "skriningJiwaTanggal", "skriningJiwaPetugas"], []);
  const KELAS_IDS = useMemo(() => ["kelasIbuTempat", "kelasIbuTanggal", "kelasIbuPetugas"], []);
  const BF_KF_IDS = useMemo(() => ["kf1Tempat","kf1Tanggal","kf1Petugas","kf2Tempat","kf2Tanggal","kf2Petugas","kf3Tempat","kf3Tanggal","kf3Petugas","kf4Tempat","kf4Tanggal","kf4Petugas","vitATanggal"], []);
  const BAYI_KN_IDS = useMemo(() => ["kn0Tanggal","kn0Tempat","kn0Petugas","kn1Tanggal","kn1Tempat","kn1Petugas","kn2Tanggal","kn2Tempat","kn2Petugas","kn3Tanggal","kn3Tempat","kn3Petugas"], []);
  const BALITA_IDS = useMemo(() => ["obatCacingTanggal","vitA6_11Bulan","vitA12Bulan","mtKepatuhan"], []);
  const DEWASA_EXTRA_IDS = useMemo(() => ["tdPeriksaSetahunTanggal","tdPeriksaSetahunTempat","tdPeriksaSetahunHasil","tdPeriksaSebulanTanggal","tdPeriksaSebulanTempat","tdPeriksaSebulanHasil","gdPeriksaSetahunTanggal","gdPeriksaSetahunTempat","gdPeriksaSetahunHasil","gdPeriksaSebulanTanggal","gdPeriksaSebulanTempat","gdPeriksaSebulanHasil"], []);
  const LANSIA_EXTRA_IDS = useMemo(() => ["aksTempat","aksTanggal","skilasTempat","skilasTanggal"], []);
  const TBC_IDS = useMemo(() => ["kontakEratJenis"], []);
  const alwaysSet = useMemo(() => new Set([...K1K6_IDS, ...EDUKASI_IDS, ...SKRINING_IDS, ...KELAS_IDS, ...BF_KF_IDS, ...BAYI_KN_IDS, ...BALITA_IDS, ...DEWASA_EXTRA_IDS, ...LANSIA_EXTRA_IDS, ...TBC_IDS]), [K1K6_IDS, EDUKASI_IDS, SKRINING_IDS, KELAS_IDS, BF_KF_IDS, BAYI_KN_IDS, BALITA_IDS, DEWASA_EXTRA_IDS, LANSIA_EXTRA_IDS, TBC_IDS]);
  const [openT1, setOpenT1] = useState(true);
  const [openT2, setOpenT2] = useState(true);
  const [openT3, setOpenT3] = useState(true);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpenMap((m) => ({ ...m, [k]: !(m[k] ?? true) }));
  const isOpen = (k: string) => openMap[k] ?? true;

  const identitas = useMemo(() => fields.filter((f) => f.section === "sasaran:identitas"), [fields]);
  const kolom = useMemo(() => fields.filter((f) => f.section === "sasaran:kolom" && !conditionalIds.has(f.id) && !alwaysSet.has(f.id)), [fields, conditionalIds, alwaysSet]);
  const bools = useMemo(() => fields.filter((f) => f.section === "sasaran:bools"), [fields]);
  const imunBools = useMemo(() => bools.filter((b) => b.id.startsWith("imun")), [bools]);
  const nonImunBools = useMemo(() => bools.filter((b) => !b.id.startsWith("imun")), [bools]);
  const baha = useMemo(() => fields.filter((f) => f.section === "sasaran:baha"), [fields]);
  const imunGroups = useMemo(() => {
    // Grup default dipegang via referensi langsung: tanpa optional chain,
    // valid baik dengan maupun tanpa noUncheckedIndexedAccess.
    const defaultGroup = { title: "0 bln", ids: [] as string[] };
    const map: Record<string, { title: string; ids: string[] }> = {
      "0": defaultGroup,
      "1": { title: "1 bln", ids: [] },
      "2": { title: "2 bln", ids: [] },
      "3": { title: "3 bln", ids: [] },
      "4": { title: "4 bln", ids: [] },
      "9": { title: "9 bln", ids: [] },
      "10": { title: "10 bln", ids: [] },
      "12": { title: "12 bln", ids: [] },
      "18": { title: "18 bln", ids: [] },
    };
    for (const b of imunBools) {
      const m = b.id.match(/^imun(\d+)/);
      const k = m === null ? undefined : m[1];
      const entry = k === undefined ? defaultGroup : (map[k] ?? defaultGroup);
      entry.ids.push(b.id);
    }
    return Object.entries(map).filter(([, v]) => v.ids.length > 0);
  }, [imunBools]);

  return (
    <div className="rounded-[10px] border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <b className="text-[13px]">{label}</b>
          <span className="text-[11px] text-muted">Anggota: {anggota?.nama || "—"}</span>
        </div>
        <button type="button" onClick={() => dispatch({ type: "REMOVE_PENILAIAN", id: p.id })} className="text-muted hover:text-danger" aria-label="Hapus penilaian">
          <X size={16} />
        </button>
      </div>

      {identitas.length > 0 ? (
        <div className="grid gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Identitas</span>
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {identitas.map((f) => (
              <FieldCell
                key={f.id}
                field={f}
                value={p.values[f.id] ?? ""}
                invalid={!!state.invalid[`${p.id}:${f.id}`]}
                onChange={(v) => {
                  dispatch({ type: "SET_VALUE", id: p.id, key: f.id, value: v });
                  if (f.id === "nama" && fieldMap.has("paraf")) dispatch({ type: "SET_VALUE", id: p.id, key: "paraf", value: v });
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {kolom.length > 0 ? (
        <div className="mt-3 grid gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kolom pemantauan</span>
          <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {kolom.map((f) => (
              <FieldCell
                key={f.id}
                field={f}
                value={p.values[f.id] ?? ""}
                invalid={!!state.invalid[`${p.id}:${f.id}`]}
                onChange={(v) => {
                  dispatch({ type: "SET_VALUE", id: p.id, key: f.id, value: v });
                  const toClear: string[] = [];
                  for (const r of rules) {
                    if (r.kind === "values" && r.trigger === f.id) {
                      const active = r.whenNonEmpty ? !!String(v).trim() : r.when !== undefined ? String(v) === r.when : !!String(v).trim();
                      if (!active) toClear.push(...r.dependents);
                    }
                  }
                  if (toClear.length) dispatch({ type: "BATCH_CLEAR_VALUES", id: p.id, keys: toClear });
                }}
              />
            ))}
          </div>
          {rules
            .filter((r) => r.kind === "values" && isConditionalActive(r, p.values, p.checks))
            .map((r) => (
              <div key={r.trigger} className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                {r.dependents.map((fid) => {
                  const field = fieldMap.get(fid);
                  if (!field) return null;
                  return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                })}
              </div>
            ))}
        </div>
      ) : null}

      {p.sasaran === "ibu-hamil" && K1K6_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Periksa kehamilan (K1-K6)</span>
          <div className="grid gap-3 rounded-lg border border-line bg-muted/10 p-3">
            <div className="grid gap-2 rounded-md border border-line bg-surface p-2">
              <button type="button" onClick={() => setOpenT1((v) => !v)} className="flex w-full items-center justify-between text-left">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink">Trimester 1 (≤12 minggu) — sekali: K1</span>
                <span className="text-xs text-muted">{openT1 ? <ChevronDown size={12}/> : <ChevronRight size={12} />}</span>
              </button>
              {openT1 ? (
                <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                  {["k1Tempat", "k1Tanggal", "k1Petugas"].map((fid) => {
                    const field = fieldMap.get(fid);
                    if (!field) return null;
                    return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                  })}
                </div>
              ) : null}
            </div>
            <div className="grid gap-2 rounded-md border border-line bg-surface p-2">
              <button type="button" onClick={() => setOpenT2((v) => !v)} className="flex w-full items-center justify-between text-left">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink">Trimester 2 (12-24 minggu) — 2 kali: K2, K3</span>
                <span className="text-xs text-muted">{openT2 ? <ChevronDown size={12}/> : <ChevronRight size={12} />}</span>
              </button>
              {openT2 ? (
                <>
                  <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                    {["k2Tempat", "k2Tanggal", "k2Petugas"].map((fid) => {
                      const field = fieldMap.get(fid);
                      if (!field) return null;
                      return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                    {["k3Tempat", "k3Tanggal", "k3Petugas"].map((fid) => {
                      const field = fieldMap.get(fid);
                      if (!field) return null;
                      return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                    })}
                  </div>
                </>
              ) : null}
            </div>
            <div className="grid gap-2 rounded-md border border-line bg-surface p-2">
              <button type="button" onClick={() => setOpenT3((v) => !v)} className="flex w-full items-center justify-between text-left">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink">Trimester 3 (24–40 minggu) — 3 kali: K4, K5, K6</span>
                <span className="text-xs text-muted">{openT3 ? <ChevronDown size={12}/> : <ChevronRight size={12} />}</span>
              </button>
              {openT3 ? (
                <>
                  <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                    {["k4Tempat", "k4Tanggal", "k4Petugas"].map((fid) => {
                      const field = fieldMap.get(fid);
                      if (!field) return null;
                      return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                    {["k5Tempat", "k5Tanggal", "k5Petugas"].map((fid) => {
                      const field = fieldMap.get(fid);
                      if (!field) return null;
                      return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                    {["k6Tempat", "k6Tanggal", "k6Petugas"].map((fid) => {
                      const field = fieldMap.get(fid);
                      if (!field) return null;
                      return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                    })}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {EDUKASI_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Edukasi kunjungan nakes</span>
          <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1 rounded-[8px] border border-line bg-muted/10 p-3">
            {EDUKASI_IDS.map((fid) => {
              const field = fieldMap.get(fid);
              if (!field) return null;
              return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
            })}
          </div>
        </div>
      ) : null}

      {SKRINING_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Skrining kesehatan jiwa</span>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1 rounded-[8px] border border-line bg-muted/10 p-3">
            {SKRINING_IDS.map((fid) => {
              const field = fieldMap.get(fid);
              if (!field) return null;
              return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
            })}
          </div>
        </div>
      ) : null}

      {KELAS_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kelas ibu hamil</span>
          <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1 rounded-[8px] border border-line bg-muted/10 p-3">
            {KELAS_IDS.map((fid) => {
              const field = fieldMap.get(fid);
              if (!field) return null;
              return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
            })}
          </div>
        </div>
      ) : null}

      {p.sasaran === "bersalin-nifas" && BF_KF_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kunjungan Nifas & Vitamin A</span>
          <div className="grid gap-2 rounded-lg border border-line bg-muted/10 p-2">
            {[ ["KF1 (6–48 jam)", ["kf1Tempat","kf1Tanggal","kf1Petugas"]], ["KF2 (3–7 hari)", ["kf2Tempat","kf2Tanggal","kf2Petugas"]], ["KF3 (8–28 hari)", ["kf3Tempat","kf3Tanggal","kf3Petugas"]], ["KF4 (29–42 hari)", ["kf4Tempat","kf4Tanggal","kf4Petugas"]], ["Vitamin A", ["vitATanggal"]] ].map(([title, fids]) => (
              <div key={title as string} className="grid gap-2 rounded-md border border-line bg-surface p-2">
                <button type="button" onClick={() => toggle(title as string)} className="flex w-full items-center justify-between text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink">{title as string}</span>
                  <span className="text-xs text-muted">{isOpen(title as string) ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
                </button>
                {isOpen(title as string) ? (
                  <div className={`grid gap-3 ${(fids as string[]).length === 1 ? "grid-cols-1" : "grid-cols-3"} max-md:grid-cols-1`}>
                    {(fids as string[]).map((fid) => {
                      const field = fieldMap.get(fid);
                      if (!field) return null;
                      return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {p.sasaran === "bayi" && BAYI_KN_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pelayanan Neonatal (KN0–KN3)</span>
          <div className="grid gap-2 rounded-lg border border-line bg-muted/10 p-2">
            {[ ["KN0 (0–6 jam)", ["kn0Tempat","kn0Tanggal","kn0Petugas"]], ["KN1", ["kn1Tempat","kn1Tanggal","kn1Petugas"]], ["KN2", ["kn2Tempat","kn2Tanggal","kn2Petugas"]], ["KN3", ["kn3Tempat","kn3Tanggal","kn3Petugas"]] ].map(([title, fids]) => (
              <div key={title as string} className="grid gap-2 rounded-md border border-line bg-surface p-2">
                <button type="button" onClick={() => toggle(title as string)} className="flex w-full items-center justify-between text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink">{title as string}</span>
                  <span className="text-xs text-muted">{isOpen(title as string) ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
                </button>
                {isOpen(title as string) ? (
                  <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                    {(fids as string[]).map((fid) => {
                      const field = fieldMap.get(fid);
                      if (!field) return null;
                      return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {p.sasaran === "balita" && BALITA_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Suplementasi Balita</span>
          <div className="grid gap-2 rounded-lg border border-line bg-muted/10 p-2">
            <div className="grid gap-2 rounded-md border border-line bg-surface p-2">
              <button type="button" onClick={() => toggle("balita-suplemen")} className="flex w-full items-center justify-between text-left">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink">Obat & Vitamin</span>
                <span className="text-xs text-muted">{isOpen("balita-suplemen") ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
              </button>
              {isOpen("balita-suplemen") ? (
                <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                  {BALITA_IDS.map((fid) => {
                    const field = fieldMap.get(fid);
                    if (!field) return null;
                    return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {(p.sasaran === "dewasa" || p.sasaran === "lansia") && DEWASA_EXTRA_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pemeriksaan Rutin</span>
          <div className="grid gap-2 rounded-lg border border-line bg-muted/10 p-2">
            {[ ["TD Setahun", ["tdPeriksaSetahunTempat","tdPeriksaSetahunTanggal","tdPeriksaSetahunHasil"]], ["TD Sebulan", ["tdPeriksaSebulanTempat","tdPeriksaSebulanTanggal","tdPeriksaSebulanHasil"]], ["Gula Darah Setahun", ["gdPeriksaSetahunTempat","gdPeriksaSetahunTanggal","gdPeriksaSetahunHasil"]], ["Gula Darah Sebulan", ["gdPeriksaSebulanTempat","gdPeriksaSebulanTanggal","gdPeriksaSebulanHasil"]] ].map(([title, fids]) => {
              const has = (fids as string[]).some((id) => fieldMap.has(id));
              if (!has) return null;
              return (
                <div key={title as string} className="grid gap-2 rounded-md border border-line bg-surface p-2">
                  <button type="button" onClick={() => toggle(title as string)} className="flex w-full items-center justify-between text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-ink">{title as string}</span>
                    <span className="text-xs text-muted">{isOpen(title as string) ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
                  </button>
                  {isOpen(title as string) ? (
                    <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                      {(fids as string[]).map((fid) => {
                        const field = fieldMap.get(fid);
                        if (!field) return null;
                        return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {p.sasaran === "lansia" && LANSIA_EXTRA_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Skrining Geriatri</span>
          <div className="grid gap-2 rounded-lg border border-line bg-muted/10 p-2">
            {[ ["AKS", ["aksTempat","aksTanggal"]], ["SKILAS", ["skilasTempat","skilasTanggal"]] ].map(([title, fids]) => (
              <div key={title as string} className="grid gap-2 rounded-md border border-line bg-surface p-2">
                <button type="button" onClick={() => toggle(title as string)} className="flex w-full items-center justify-between text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink">{title as string}</span>
                  <span className="text-xs text-muted">{isOpen(title as string) ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
                </button>
                {isOpen(title as string) ? (
                  <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                    {(fids as string[]).map((fid) => {
                      const field = fieldMap.get(fid);
                      if (!field) return null;
                      return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {p.sasaran === "tbc" && TBC_IDS.some((id) => fieldMap.has(id)) ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kontak Erat</span>
          <div className="grid gap-2 rounded-lg border border-line bg-muted/10 p-2">
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1 rounded-md border border-line bg-surface p-2">
              {TBC_IDS.map((fid) => {
                const field = fieldMap.get(fid);
                if (!field) return null;
                return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
              })}
            </div>
          </div>
        </div>
      ) : null}

      {nonImunBools.length > 0 ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kondisi / pelayanan</span>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 max-md:grid-cols-2 max-sm:grid-cols-1">
            {nonImunBools.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox
                  checked={p.checks[b.id] ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    dispatch({ type: "SET_CHECK", id: p.id, key: b.id, checked });
                    if (!checked) {
                      const toClear: string[] = [];
                      for (const r of rules) if (r.kind === "checks" && r.trigger === b.id) toClear.push(...r.dependents);
                      if (toClear.length) dispatch({ type: "BATCH_CLEAR_VALUES", id: p.id, keys: toClear });
                    }
                  }}
                  aria-label={b.label}
                />
                {b.label}
                {b.required ? <span className="text-danger">*</span> : null}
              </label>
            ))}
          </div>
          {rules
            .filter((r) => r.kind === "checks" && isConditionalActive(r, p.values, p.checks))
            .map((r) => {
              const cols = r.dependents.length === 2 ? "grid-cols-2" : r.dependents.length === 1 ? "grid-cols-1" : "grid-cols-3";
              return (
                <div key={r.trigger} className={`grid ${cols} gap-3 max-md:grid-cols-1`}>
                  {r.dependents.map((fid) => {
                    const field = fieldMap.get(fid);
                    if (!field) return null;
                    return <FieldCell key={fid} field={field} value={p.values[fid] ?? ""} invalid={!!state.invalid[`${p.id}:${fid}`]} onChange={(v) => dispatch({ type: "SET_VALUE", id: p.id, key: fid, value: v })} />;
                  })}
                </div>
              );
            })}
        </div>
      ) : null}

      {imunBools.length > 0 ? (
        <div className="mt-3 grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Imunisasi</span>
          <div className="grid gap-2 rounded-lg border border-line bg-muted/10 p-2">
            {imunGroups.map(([key, grp]) => (
              <div key={key} className="grid gap-2 rounded-md border border-line bg-surface p-2">
                <button type="button" onClick={() => toggle(`imun-${key}`)} className="flex w-full items-center justify-between text-left">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink">{grp.title}</span>
                  <span className="text-xs text-muted">{isOpen(`imun-${key}`) ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
                </button>
                {isOpen(`imun-${key}`) ? (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-sm:grid-cols-1">
                    {grp.ids.map((bid) => {
                      const b = imunBools.find((x) => x.id === bid);
                      if (!b) return null;
                      return (
                        <label key={b.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                          <Checkbox checked={p.checks[b.id] ?? false} onChange={(e) => dispatch({ type: "SET_CHECK", id: p.id, key: b.id, checked: e.target.checked })} aria-label={b.label} />
                          {b.label}
                          {b.required ? <span className="text-danger">*</span> : null}
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {baha.length > 0 ? (
        <div className="mt-3 grid gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">BaHa — tanda bahaya</span>
            <span className="text-[11px] text-muted">
              {baha.filter((b) => p.checks[b.id]).length}/{baha.length} ada
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-sm:grid-cols-1">
            {baha.map((b) => (
              <label key={b.id} className="flex cursor-pointer items-center gap-2 text-[13px]">
                <Checkbox checked={p.checks[b.id] ?? false} onChange={(e) => dispatch({ type: "SET_CHECK", id: p.id, key: b.id, checked: e.target.checked })} className={p.checks[b.id] ? "!border-danger-border" : ""} />
                {b.label}
                {b.required ? <span className="text-danger">*</span> : null}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Prioritas program</span>
        <ChipGroup options={PRIOS.map((prio) => ({ value: prio, label: prio }))} selected={p.prioritas} onToggle={(v) => dispatch({ type: "TOGGLE_PRIORITAS", id: p.id, prio: v })} />
      </div>
    </div>
  );
}
