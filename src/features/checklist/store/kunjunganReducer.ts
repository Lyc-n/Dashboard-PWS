import { HASIL_KUNJUNGAN } from "@/lib/constants";
import { sasaranDef } from "@/lib/kr-form";
import { seedKrTemplates } from "@/lib/kr-templates";
import type { KrTemplates } from "@/lib/kr-templates";
import type { SasaranKey } from "@/lib/kr-form";
import type { AnggotaKeluarga, KeluargaInfo, MasalahTindak, PenilaianForm, Sanitasi } from "@/hooks/use-kunjungan";
import { createRecordId } from "../types";

export interface KunjunganState {
  info: KeluargaInfo;
  sanitasi: Sanitasi;
  anggota: AnggotaKeluarga[];
  penilaian: PenilaianForm[];
  masalah: MasalahTindak[];
  hasil: string;
  jadwal: string;
  ttd: string;
  invalid: Record<string, boolean>;
}

const EMPTY_INFO: KeluargaInfo = {
  tglPengumpulan: "2026-02-14",
  alamat: "",
  kelurahan: "",
  kecamatan: "",
  kabKota: "Kota Pasuruan",
  provinsi: "Jawa Timur",
  hpKK: "",
  puskesmas: "Puskesmas Trajeng",
  pustu: "",
  posyandu: "",
  namaKK: "",
};

const EMPTY_SANITASI: Sanitasi = {
  jkn: false,
  airBersih: false,
  jenisAir: "",
  jamban: false,
  jambanSaniter: "",
  jenisSumberAir: "",
  ventilasi: false,
  odgj: false,
  tbc: false,
  hipertensi: false,
  dm: false,
};

const EMPTY_ANGGOTA: Omit<AnggotaKeluarga, "id"> = {
  nama: "",
  nik: "",
  tglLahir: "",
  jk: "P",
  hubKK: "",
  statusKawin: "",
  pendidikan: "",
  pekerjaan: "",
};

function emptyPenilaian(anggotaId: string, sasaran: SasaranKey, templates?: KrTemplates): PenilaianForm {
  const fallback = sasaranDef(sasaran);
  const prioritas = templates ? templates.sasaran[sasaran].prioritasDefault : fallback.prioritasDefault;
  return { id: createRecordId(), anggotaId, sasaran, values: {}, checks: {}, prioritas: [...prioritas] };
}

export function initialKunjunganState(): KunjunganState {
  return {
    info: { ...EMPTY_INFO },
    sanitasi: { ...EMPTY_SANITASI },
    anggota: [],
    penilaian: [],
    masalah: [],
    hasil: HASIL_KUNJUNGAN[0],
    jadwal: "",
    ttd: "",
    invalid: {},
  };
}

export type KunjunganAction =
  | { type: "SET_FIELD"; key: keyof KeluargaInfo; value: string }
  | { type: "SET_SAN_FIELD"; key: keyof Sanitasi; value: string | boolean }
  | { type: "ADD_ANGGOTA" }
  | { type: "UPDATE_ANGGOTA"; id: string; key: keyof AnggotaKeluarga; value: string }
  | { type: "REMOVE_ANGGOTA"; id: string }
  | { type: "ADD_PENILAIAN"; anggotaId: string; sasaran: SasaranKey; templates: KrTemplates }
  | { type: "REMOVE_PENILAIAN"; id: string }
  | { type: "SET_VALUE"; id: string; key: string; value: string }
  | { type: "SET_CHECK"; id: string; key: string; checked: boolean }
  | { type: "BATCH_CLEAR_VALUES"; id: string; keys: string[] }
  | { type: "TOGGLE_PRIORITAS"; id: string; prio: string }
  | { type: "ADD_MASALAH" }
  | { type: "UPDATE_MASALAH"; id: string; key: keyof MasalahTindak; value: string }
  | { type: "REMOVE_MASALAH"; id: string }
  | { type: "SET_HASIL"; value: string }
  | { type: "SET_JADWAL"; value: string }
  | { type: "SET_TTD"; value: string }
  | { type: "SET_INVALID"; invalid: Record<string, boolean> }
  | { type: "RESET" }
  | { type: "FILL_DEMO" };

export function kunjunganReducer(state: KunjunganState, action: KunjunganAction): KunjunganState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, info: { ...state.info, [action.key]: action.value } };
    case "SET_SAN_FIELD":
      return { ...state, sanitasi: { ...state.sanitasi, [action.key]: action.value } };
    case "ADD_ANGGOTA":
      return { ...state, anggota: [...state.anggota, { ...EMPTY_ANGGOTA, id: createRecordId() } as AnggotaKeluarga] };
    case "UPDATE_ANGGOTA":
      return { ...state, anggota: state.anggota.map((m) => (m.id === action.id ? { ...m, [action.key]: action.value } : m)) };
    case "REMOVE_ANGGOTA":
      return { ...state, anggota: state.anggota.filter((m) => m.id !== action.id), penilaian: state.penilaian.filter((p) => p.anggotaId !== action.id) };
    case "ADD_PENILAIAN":
      return { ...state, penilaian: [...state.penilaian, emptyPenilaian(action.anggotaId, action.sasaran, action.templates)] };
    case "REMOVE_PENILAIAN":
      return { ...state, penilaian: state.penilaian.filter((p) => p.id !== action.id) };
    case "SET_VALUE":
      return { ...state, penilaian: state.penilaian.map((p) => (p.id === action.id ? { ...p, values: { ...p.values, [action.key]: action.value } } : p)) };
    case "SET_CHECK":
      return { ...state, penilaian: state.penilaian.map((p) => (p.id === action.id ? { ...p, checks: { ...p.checks, [action.key]: action.checked } } : p)) };
    case "BATCH_CLEAR_VALUES":
      return {
        ...state,
        penilaian: state.penilaian.map((p) => {
          if (p.id !== action.id) return p;
          const nextVals = { ...p.values };
          for (const k of action.keys) nextVals[k] = "";
          return { ...p, values: nextVals };
        }),
      };
    case "TOGGLE_PRIORITAS":
      return {
        ...state,
        penilaian: state.penilaian.map((p) =>
          p.id === action.id ? { ...p, prioritas: p.prioritas.includes(action.prio) ? p.prioritas.filter((x) => x !== action.prio) : [...p.prioritas, action.prio] } : p,
        ),
      };
    case "ADD_MASALAH":
      return { ...state, masalah: [...state.masalah, { id: createRecordId(), nama: "", nik: "", tglLahir: "", alamat: "", telepon: "", masalah: "", tindakLanjut: "" }] };
    case "UPDATE_MASALAH":
      return { ...state, masalah: state.masalah.map((r) => (r.id === action.id ? { ...r, [action.key]: action.value } : r)) };
    case "REMOVE_MASALAH":
      return { ...state, masalah: state.masalah.filter((r) => r.id !== action.id) };
    case "SET_HASIL":
      return { ...state, hasil: action.value };
    case "SET_JADWAL":
      return { ...state, jadwal: action.value };
    case "SET_TTD":
      return { ...state, ttd: action.value };
    case "SET_INVALID":
      return { ...state, invalid: action.invalid };
    case "RESET":
      return initialKunjunganState();
    case "FILL_DEMO": {
      return {
        ...initialKunjunganState(),
        info: {
          tglPengumpulan: "2026-02-14",
          alamat: "Jl. Ngemplakrejo gg. III no. 12",
          kelurahan: "Ngemplakrejo",
          kecamatan: "Trajeng",
          kabKota: "Kota Pasuruan",
          provinsi: "Jawa Timur",
          hpKK: "081234567890",
          puskesmas: "Puskesmas Trajeng",
          pustu: "Pustu Ngemplakrejo",
          posyandu: "Mawar 2",
          namaKK: "Bpk. Salim",
        },
        sanitasi: { ...EMPTY_SANITASI, jkn: true, airBersih: true, jamban: true, jambanSaniter: "Kloset", ventilasi: true },
        anggota: [
          { id: "demo-a1", nama: "Budi Setiawan", nik: "3579015202800001", tglLahir: "1980-02-15", jk: "L", hubKK: "Anak", statusKawin: "Kawin", pendidikan: "SMA", pekerjaan: "Buruh" },
          { id: "demo-a2", nama: "Siti Rahmawati", nik: "3579016202900002", tglLahir: "1990-02-16", jk: "P", hubKK: "Istri", statusKawin: "Kawin", pendidikan: "SMP", pekerjaan: "IRT" },
        ],
        penilaian: [
          { id: "demo-p1", anggotaId: "demo-a1", sasaran: "dewasa", values: { merokok: "Pasif" }, checks: { suhu: false, tdAdaObat: true, gdAdaObat: false, tdPeriksaSetahun: true, tdPeriksaSebulan: true, skriningJiwa: false, edukasi: true }, prioritas: [] },
          { id: "demo-p2", anggotaId: "demo-a2", sasaran: "ibu-hamil", values: { nama: "Siti Rahmawati", umur: "36", kehamilanKe: "3", paraf: "Siti Rahmawati" }, checks: { bukuKia: true, ttdAda: true, ttdMinum: true, skriningJiwa: false }, prioritas: ["Bumil Risti"] },
        ],
        masalah: [
          { id: "demo-m1", nama: "Budi Setiawan", nik: "3579015202800001", tglLahir: "1980-02-15", alamat: "Jl. Ngemplakrejo gg. III no. 12", telepon: "081234567890", masalah: "Hipertensi tidak patuh berobat (ada obat tapi tidak minum 24 jam terakhir)", tindakLanjut: "Edukasi patuh minum obat & jadwal kontrol" },
        ],
        ttd: "Siti Aminah",
        hasil: HASIL_KUNJUNGAN[0],
      };
    }
    default:
      return state;
  }
}

// Keep seed stable reference
export const seededTemplates = seedKrTemplates();
