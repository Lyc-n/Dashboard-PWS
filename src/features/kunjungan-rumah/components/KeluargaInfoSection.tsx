import { useEffect, useMemo, useRef, useState } from "react";
import type { KunjunganRumahTemplates } from "@/lib/kunjungan-rumah-templates";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormField } from "@/components/molecules/FormField";
import { listSurveyors, cariSasaranWarga } from "@/lib/utils.functions";
import type { SasaranSuggestion } from "@/features/kunjungan-rumah/lib/warga-row";
import { cn } from "@/lib/utils";
import type { KunjunganRumahAction, KunjunganRumahState } from "@/features/kunjungan-rumah/store/kunjunganRumahReducer";

const PLACEHOLDER: Partial<Record<string, string>> = {
  alamat: "cth. Jl. Trajeng gg. II no. 8",
  hpKK: "cth. 62812xxxx",
  posyandu: "cth. Melati 1",
  puskesmas: "cth. Puskesmas Trajeng",
};

/** Panjang ketikan minimum sebelum server mencari suggestion — 3 huruf sudah
 *  cukup unik di 20 ribu baris data import. */
const MIN_KETIK = 3;
const DEBOUNCE_MS = 300;

interface Props {
  state: KunjunganRumahState;
  templates: KunjunganRumahTemplates;
  dispatch: React.Dispatch<KunjunganRumahAction>;
}

/** Dropdown suggestion warga sasaran dari `data_warga_import`. */
function SaranDropdown({
  rows,
  busy,
  onPilih,
  onTutup,
}: {
  rows: SasaranSuggestion[];
  busy: boolean;
  onPilih: (row: SasaranSuggestion) => void;
  onTutup: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const klik = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onTutup();
    };
    document.addEventListener("mousedown", klik);
    return () => document.removeEventListener("mousedown", klik);
  }, [onTutup]);

  return (
    <div
      ref={ref}
      className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-surface shadow-lg"
    >
      {busy ? <p className="px-3 py-2 text-[11px] text-muted">Mencari data sasaran…</p> : null}
      {!busy && rows.length === 0 ? (
        <p className="px-3 py-2 text-[11px] text-muted">Tidak ada di Data Sasaran. Isi manual.</p>
      ) : null}
      {rows.map((r) => (
        <button
          key={r.rawId}
          type="button"
          onClick={() => onPilih(r)}
          className="block w-full px-3 py-2 text-left hover:bg-[var(--color-accent-light)]"
        >
          <span className="block text-[12px] font-semibold text-ink">{r.namaArt || r.namaKk || "—"}</span>
          <span className="block text-[11px] text-muted">
            {r.nik ? `NIK ${r.nik}` : "NIK belum ada"} · KK {r.namaKk || "—"}
          </span>
          {r.alamat ? <span className="block text-[11px] text-muted">{r.alamat}</span> : null}
        </button>
      ))}
    </div>
  );
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

  // Suggestion warga sasaran. Satu state dipakai bersama oleh input NIK dan
  // nama KK; `sumber` menentukan input mana yang sedang diketik supaya pilihan
  // tidak muncul di tempat yang tidak diklik.
  const [saran, setSaran] = useState<{ sumber: "nik" | "namaKK"; rows: SasaranSuggestion[] } | null>(null);
  const [saranBusy, setSaranBusy] = useState(false);

  useEffect(() => {
    const sumber = saran?.sumber;
    const q = (sumber === "nik" ? state.info.nik : sumber === "namaKK" ? state.info.namaKK : "").trim();
    if (!sumber || q.length < MIN_KETIK) {
      setSaran((s) => (s ? { ...s, rows: [] } : s));
      return;
    }
    let hidup = true;
    setSaranBusy(true);
    const t = setTimeout(() => {
      void cariSasaranWarga({ data: { q } })
        .then((rows) => {
          if (hidup) setSaran((s) => (s && s.sumber === sumber ? { sumber, rows } : s));
        })
        .catch(() => {
          if (hidup) setSaran((s) => (s && s.sumber === sumber ? { sumber, rows: [] } : s));
        })
        .finally(() => {
          if (hidup) setSaranBusy(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      hidup = false;
      clearTimeout(t);
    };
  }, [saran?.sumber, state.info.nik, state.info.namaKK]);

  const bukaSaran = (sumber: "nik" | "namaKK") => setSaran((s) => (s?.sumber === sumber ? s : { sumber, rows: [] }));
  const tutupSaran = () => setSaran(null);
  const pilihSaran = (row: SasaranSuggestion) => {
    dispatch({ type: "APPLY_SASARAN", row });
    setSaran(null);
  };
  const saranUntuk = (sumber: "nik" | "namaKK") => (saran?.sumber === sumber ? saran.rows : null);

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
        if (f.id === "nik" || f.id === "namaKK") {
          const sumber: "nik" | "namaKK" = f.id;
          const rows = saranUntuk(sumber);
          const invalid = !!state.invalid[f.id];
          const errorId = `${f.id}-error`;
          return (
            <FormField
              key={f.id}
              label={sumber === "nik" ? "NIK sasaran utama" : f.label}
              required
              invalid={invalid}
              error={
                sumber === "nik"
                  ? "Wajib 16 digit dan harus cocok dengan NIK salah satu anggota keluarga."
                  : "Wajib diisi."
              }
              hint={
                sumber === "nik"
                  ? "Satu kunjungan dihitung untuk NIK ini di dashboard dan laporan. Ketik untuk cari di Data Sasaran."
                  : "Ketik minimal 3 huruf untuk cari di Data Sasaran, lalu pilih datanya."
              }
              errorId={errorId}
            >
              <div className="relative">
                <Input
                  value={state.info[f.id]}
                  onFocus={() => bukaSaran(sumber)}
                  onChange={(e) => {
                    bukaSaran(sumber);
                    dispatch({
                      type: "SET_FIELD",
                      key: f.id,
                      value:
                        sumber === "nik"
                          ? e.target.value.replace(/\D/g, "").slice(0, 16)
                          : e.target.value,
                    });
                  }}
                  inputMode={sumber === "nik" ? "numeric" : undefined}
                  maxLength={sumber === "nik" ? 16 : undefined}
                  placeholder={sumber === "nik" ? "16 digit NIK" : PLACEHOLDER[f.id] ?? ""}
                  invalid={invalid}
                  className={cn(rows && rows.length > 0 && "border-accent")}
                  aria-describedby={invalid ? errorId : undefined}
                />
                {rows ? (
                  <SaranDropdown
                    rows={rows}
                    busy={saranBusy}
                    onPilih={pilihSaran}
                    onTutup={tutupSaran}
                  />
                ) : null}
              </div>
            </FormField>
          );
        }
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
