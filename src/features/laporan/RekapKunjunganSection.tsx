import { useMemo, useState } from "react";
import { Printer, RotateCcw } from "lucide-react";
import { seedAdminStaff } from "@/lib/seeds";
import type { Staff } from "@/lib/seeds";
import { APP_BRAND, KELS, POSY, STORAGE_KEYS } from "@/lib/constants";
import { computeRekap, rekapScopeId, SASARAN_GROUP_LABELS } from "@/lib/rekap-kunjungan";
import type { RekapAuto } from "@/lib/rekap-kunjungan";
import { useRekapKunjungan } from "@/hooks/use-rekap-kunjungan";
import type { RekapField } from "@/hooks/use-rekap-kunjungan";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/providers/auth";
import { isAdminUser } from "@/lib/auth.server";
import { useToast } from "@/providers/toast";
import { SectionCard } from "@/components/molecules/SectionCard";
import { Toolbar } from "@/components/molecules/Toolbar";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Button } from "@/components/atoms/Button";
import { LogoEmblem } from "@/components/atoms/LogoEmblem";

interface Props {
  judul?: string;
  setJudul?: (v: string) => void;
  ttdNama: string;
  setTtdNama: (v: string) => void;
  ttdJabatan: string;
  setTtdJabatan: (v: string) => void;
}

const TODAY = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);

const ROMAN = ["", "I", "II", "III", "IV", "V"] as const;

const NUMBER_FIELDS: RekapField[] = [
  "keluarga",
  "sasaranIbuHamil",
  "sasaranBersalinNifas",
  "sasaranBayiApras",
  "sasaranSekolahRemaja",
  "sasaranProduktif",
  "sasaranLansia",
  "masalahIbuTidakAkses",
  "masalahIbuTandaBahaya",
  "masalahDewasaTidakAdaPelayanan",
  "masalahDewasaBergejalaTbc",
  "masalahDewasaTidakMinumObat",
  "tindakEdukasi",
  "tindakLaporNakes",
];

function autoValueOf(auto: RekapAuto, field: RekapField): number {
  switch (field) {
    case "keluarga":
      return auto.keluarga;
    case "sasaranIbuHamil":
      return auto.sasaran.ibuHamil;
    case "sasaranBersalinNifas":
      return auto.sasaran.bersalinNifas;
    case "sasaranBayiApras":
      return auto.sasaran.bayiApras;
    case "sasaranSekolahRemaja":
      return auto.sasaran.sekolahRemaja;
    case "sasaranProduktif":
      return auto.sasaran.produktif;
    case "sasaranLansia":
      return auto.sasaran.lansia;
    case "masalahIbuTidakAkses":
      return auto.masalahIbuTidakAkses;
    case "masalahIbuTandaBahaya":
      return auto.masalahIbuTandaBahaya;
    case "masalahDewasaTidakAdaPelayanan":
      return auto.masalahDewasaTidakAdaPelayanan;
    case "masalahDewasaBergejalaTbc":
      return auto.masalahDewasaBergejalaTbc;
    case "masalahDewasaTidakMinumObat":
      return auto.masalahDewasaTidakMinumObat;
    case "tindakEdukasi":
      return auto.tindakEdukasi;
    case "tindakLaporNakes":
      return auto.tindakLaporNakes;
    default:
      return 0;
  }
}

function scopeParts(scopeId: string): { kel: string | null; posy: string | null; kader: string | null } {
  const [kel, posy, kader] = scopeId.split("|");
  return { kel: kel || null, posy: posy || null, kader: kader || null };
}

export function RekapKunjunganSection({
  judul = "REKAPITULASI KUNJUNGAN RUMAH (KR) — KOTA PASURUAN",
  setJudul,
  ttdNama,
  setTtdNama,
  ttdJabatan,
  setTtdJabatan,
}: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const admin = isAdminUser(user);
  const [staff] = useLocalStorage<Staff[]>(STORAGE_KEYS.adminStaff, seedAdminStaff());

  const [period, setPeriod] = useState(DEFAULT_MONTH);
  const [kel, setKel] = useState("all");
  const [posy, setPosy] = useState("all");
  const [kader, setKader] = useState("all");

  // Non-admin: wilayah & kader terkunci ke dirinya
  const effKel = admin ? kel : (user?.kel ?? "all");
  const effPosy = admin ? posy : (user?.posy ?? "all");
  const effKader = admin ? kader : (user?.name ?? "all");

  const kaderList = useMemo(() => staff.filter((s) => s.peran === "Kader" && s.on).map((s) => s.nama), [staff]);

  const { templates, records, getValue, setValue, clearScope } = useRekapKunjungan();

  const scopeId = rekapScopeId(
    effKel === "all" ? null : effKel,
    effPosy === "all" ? null : effPosy,
    effKader === "all" ? null : effKader,
  );

  const { rows } = useMemo(
    () => computeRekap(records, templates, { month: period, ...scopeParts(scopeId), staff }),
    [records, templates, period, scopeId, staff],
  );

  const autoByWeek = useMemo(() => new Map(rows.map((r) => [r.minggu, r.auto])), [rows]);

  const effective = (minggu: number, field: RekapField): string => {
    const override = getValue({ scopeId, period }, minggu, field);
    if (typeof override === "string" && override !== "") return override;
    if (field === "paraf") return "";
    const auto = autoByWeek.get(minggu);
    return auto ? String(autoValueOf(auto, field)) : "0";
  };

  const onCellChange = (minggu: number, field: RekapField, raw: string) => {
    const value = NUMBER_FIELDS.includes(field) ? raw.replace(/[^0-9]/g, "") : raw;
    setValue({ scopeId, period }, minggu, field, value);
  };

  const hasData = rows.length > 0;

  return (
    <>
      <SectionCard className="no-print" title="Rekap Kunjungan Rumah" sub="Minggu dalam bulan. Angka turun otomatis dari data checklist; sel boleh diubah manual, tersimpan per periode & wilayah.">
        <Toolbar>
          <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Periode bulan" className="max-w-[170px] max-md:max-w-none" />
          {admin ? (
            <>
              <Select value={kel} onChange={(e) => setKel(e.target.value)} aria-label="Filter kelurahan" className="max-w-[170px] max-md:max-w-none">
                <option value="all">Semua kelurahan</option>
                {KELS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
              <Select value={posy} onChange={(e) => setPosy(e.target.value)} aria-label="Filter posyandu" className="max-w-[170px] max-md:max-w-none">
                <option value="all">Semua posyandu</option>
                {POSY.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </Select>
              <Select value={kader} onChange={(e) => setKader(e.target.value)} aria-label="Filter kader" className="max-w-[200px] max-md:max-w-none">
                <option value="all">Semua kader</option>
                {kaderList.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </Select>
            </>
          ) : (
            <span className="text-xs text-muted">
              Wilayah kader: <b className="text-ink">{user?.kel ?? "—"}{user?.posy ? ` · ${user.posy}` : ""}</b>
            </span>
          )}
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={() => {
              clearScope({ scopeId, period });
              toast(`Nilai manual ${period} direset ke perhitungan otomatis.`);
            }}
          >
            <RotateCcw size={14} />
            Reset manual
          </Button>
        </Toolbar>

        <Input value={judul} onChange={(e) => setJudul?.(e.target.value)} aria-label="Judul laporan" className="mt-3 w-full" />
        <div className="mt-2 grid grid-cols-2 gap-3 max-md:grid-cols-1">
          <Input value={ttdNama} onChange={(e) => setTtdNama(e.target.value)} aria-label="Nama penanda tangan" />
          <Input value={ttdJabatan} onChange={(e) => setTtdJabatan(e.target.value)} aria-label="Jabatan penanda tangan" />
        </div>
        <Toolbar className="mt-3">
          <Button variant="primary" onClick={() => window.print()} className="ml-auto">
            <Printer size={14} />
            Cetak / Simpan PDF
          </Button>
        </Toolbar>
      </SectionCard>

      <SectionCard title={`Rekap ${period}`} sub={`Periode Bulan ${period}`}>
        <div className="mt-3.5 rounded-lg border border-line bg-surface p-4">
          <div className="mb-4 flex items-start justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2.5">
              <LogoEmblem />
              <div className="text-[11px] leading-tight">
                <b className="block text-ink">
                  {APP_BRAND.name} <span className="font-semibold">{APP_BRAND.region}</span>
                </b>
                <span className="text-muted">Puskesmas Trajeng · Jl. Panglima Sudirman 12, Kota Pasuruan</span>
              </div>
            </div>
            <span className="text-[10px] text-muted">Dicetak: {TODAY}</span>
          </div>
          <div className="mb-4 text-center">
            <b className="text-sm text-ink">{judul}</b>
            <div className="mt-1 text-muted">Periode Bulan {period}</div>
          </div>

          {!hasData ? (
            <p className="py-8 text-center text-xs text-muted">
              Tidak ada kunjungan tersimpan pada bulan {period}{scopeId !== "all" ? " dengan filter wilayah/kader ini" : ""}. Isi data di halaman Input Checklist.
            </p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th rowSpan={2} className="border border-line bg-surface-2 px-2 py-2 align-middle text-[10px] font-semibold uppercase tracking-wider text-muted">Minggu Ke</th>
                    <th rowSpan={2} className="border border-line bg-surface-2 px-2 py-2 align-middle text-[10px] font-semibold uppercase tracking-wider text-muted">Jumlah Keluarga Dikunjungi</th>
                    <th colSpan={6} className="border border-line bg-surface-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Jumlah Sasaran yang Dikunjungi</th>
                    <th colSpan={2} className="border border-line bg-surface-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Ibu Hamil, Bersalin-Nifas, Bayi, Balita & APRAS — Masalah Ditemukan</th>
                    <th colSpan={3} className="border border-line bg-surface-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Usia Sekolah, Remaja, Produktif & Lansia — Masalah Ditemukan</th>
                    <th colSpan={2} className="border border-line bg-surface-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Sasaran dengan Tindak Lanjut</th>
                    <th rowSpan={2} className="border border-line bg-surface-2 px-2 py-2 align-middle text-[10px] font-semibold uppercase tracking-wider text-muted">Paraf Petugas Pustu</th>
                  </tr>
                  <tr>
                    {[SASARAN_GROUP_LABELS.ibuHamil, SASARAN_GROUP_LABELS.bersalinNifas, SASARAN_GROUP_LABELS.bayiApras, SASARAN_GROUP_LABELS.sekolahRemaja, SASARAN_GROUP_LABELS.produktif, SASARAN_GROUP_LABELS.lansia].map((l) => (
                      <th key={l} className="border border-line bg-surface-2 px-1.5 py-1.5 text-[10px] font-semibold text-muted">{l}</th>
                    ))}
                    {["Tidak akses pelayanan", "Tanda bahaya"].map((l) => (
                      <th key={l} className="border border-line bg-surface-2 px-1.5 py-1.5 text-[10px] font-semibold text-muted">{l}</th>
                    ))}
                    {["Tidak ada pelayanan", "Bergejala TBC", "Tidak minum obat teratur"].map((l) => (
                      <th key={l} className="border border-line bg-surface-2 px-1.5 py-1.5 text-[10px] font-semibold text-muted">{l}</th>
                    ))}
                    {["Edukasi", "Lapor nakes"].map((l) => (
                      <th key={l} className="border border-line bg-surface-2 px-1.5 py-1.5 text-[10px] font-semibold text-muted">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((minggu) => {
                    const zebra = minggu % 2 === 0;
                    return (
                      <tr key={minggu} className={zebra ? "bg-surface-2/40" : ""}>
                        <td className="whitespace-nowrap border border-line px-2 py-1.5 text-center font-semibold text-ink">Minggu {ROMAN[minggu]}</td>
                        {NUMBER_FIELDS.map((field) => (
                          <td key={field} className="border border-line px-1 py-1 text-center">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={effective(minggu, field)}
                              onChange={(e) => onCellChange(minggu, field, e.target.value)}
                              className="w-14 rounded border border-transparent bg-transparent px-1 py-0.5 text-center text-[11px] text-ink focus:border-accent focus:bg-surface focus:outline-none"
                              aria-label={`Minggu ${minggu} ${field}`}
                            />
                          </td>
                        ))}
                        <td className="border border-line px-1 py-1">
                          <input
                            type="text"
                            value={effective(minggu, "paraf")}
                            onChange={(e) => onCellChange(minggu, "paraf", e.target.value)}
                            placeholder="—"
                            className="w-24 rounded border border-transparent bg-transparent px-1 py-0.5 text-center text-[11px] text-ink focus:border-accent focus:bg-surface focus:outline-none"
                            aria-label={`Minggu ${minggu} paraf`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 grid justify-items-end">
            <div className="w-72 text-center text-[11px]">
              <div className="text-muted">Kota Pasuruan, {TODAY}</div>
              <div className="mt-8 font-semibold text-ink">{ttdNama}</div>
              <div className="mt-0.5 text-muted">{ttdJabatan}</div>
            </div>
          </div>
        </div>
      </SectionCard>
    </>
  );
}