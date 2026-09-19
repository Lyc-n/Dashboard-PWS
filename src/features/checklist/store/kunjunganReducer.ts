import { HASIL_KUNJUNGAN } from "@/lib/constants";
import { sasaranDef } from "@/lib/kr-form";
import type { KrTemplates } from "@/lib/kr-templates";
import type { SasaranKey } from "@/lib/kr-form";
import type { AnggotaKeluarga, KeluargaInfo, KunjunganFoto, MasalahTindak, PenilaianForm, Sanitasi } from "@/features/checklist/models";
import { createRecordId } from "../types";
import type { KunjunganRecord } from "../types";

export interface KunjunganState {
  info: KeluargaInfo;
  sanitasi: Sanitasi;
  anggota: AnggotaKeluarga[];
  penilaian: PenilaianForm[];
  masalah: MasalahTindak[];
  hasil: string;
  jadwal: string;
  ttd: string;
  fotos: KunjunganFoto[];
  invalid: Record<string, boolean>;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY_INFO: KeluargaInfo = {
  tglPengumpulan: todayISO(),
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
  jenisAir: "",
  jambanSaniter: "",
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
  jk: "",
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
    fotos: [],
    invalid: {},
  };
}

export type KunjunganAction =
  | { type: "SET_FIELD"; key: keyof KeluargaInfo | string; value: string }
  | { type: "SET_SAN_FIELD"; key: keyof Sanitasi | string; value: string | boolean }
  | { type: "ADD_ANGGOTA" }
  | { type: "UPDATE_ANGGOTA"; id: string; key: keyof AnggotaKeluarga | string; value: string }
  | { type: "REMOVE_ANGGOTA"; id: string }
  | { type: "ADD_PENILAIAN"; anggotaId: string; sasaran: SasaranKey; templates: KrTemplates }
  | { type: "REMOVE_PENILAIAN"; id: string }
  | { type: "SET_VALUE"; id: string; key: string; value: string }
  | { type: "SET_CHECK"; id: string; key: string; checked: boolean }
  | { type: "BATCH_CLEAR_VALUES"; id: string; keys: string[] }
  | { type: "TOGGLE_PRIORITAS"; id: string; prio: string }
  | { type: "ADD_MASALAH" }
  | { type: "UPDATE_MASALAH"; id: string; key: keyof MasalahTindak | string; value: string }
  | { type: "REMOVE_MASALAH"; id: string }
  | { type: "SET_HASIL"; value: string }
  | { type: "SET_JADWAL"; value: string }
  | { type: "SET_TTD"; value: string }
  | { type: "SET_INVALID"; invalid: Record<string, boolean> }
  | { type: "ADD_FOTOS"; fotos: KunjunganFoto[] }
  | { type: "SET_FOTO_CAPTION"; index: number; caption: string }
  | { type: "REMOVE_FOTO"; index: number }
  | { type: "RESET" }
  | { type: "LOAD_RECORD"; record: KunjunganRecord }
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
        penilaian: state.penilaian.map((p) => {
          if (p.id !== action.id) return p;
          const turningOffTb = action.prio === "TB" && p.prioritas.includes("TB");
          let next = { ...p, prioritas: p.prioritas.includes(action.prio) ? p.prioritas.filter((x) => x !== action.prio) : [...p.prioritas, action.prio] };
          if (turningOffTb) {
            const nextVals = { ...next.values };
            const nextChecks = { ...next.checks };
            const tbcKeys = ["tglDiagnosa", "tempatDiagnosa", "periksaTgl", "tempatPeriksa", "namaPmo", "kontakEratJenis", "adaObat", "minum24", "ingatPeriksa", "batukTerus", "demam", "bbTurun"];
            for (const k of tbcKeys) {
              nextVals[k] = "";
              nextChecks[k] = false;
            }
            next = { ...next, values: nextVals, checks: nextChecks };
          }
          return next;
        }),
      };
    case "ADD_MASALAH":
      return { ...state, masalah: [...state.masalah, { id: createRecordId(), anggotaId: "", nama: "", nik: "", tglLahir: "", alamat: "", telepon: "", masalah: "", tindakLanjut: "" }] };
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
    case "ADD_FOTOS":
      return { ...state, fotos: [...state.fotos, ...action.fotos] };
    case "SET_FOTO_CAPTION":
      return { ...state, fotos: state.fotos.map((f, i) => (i === action.index ? { ...f, caption: action.caption } : f)) };
    case "REMOVE_FOTO":
      return { ...state, fotos: state.fotos.filter((_, i) => i !== action.index) };
    case "RESET":
      return initialKunjunganState();
    case "LOAD_RECORD": {
      const r = action.record;
      return {
        ...initialKunjunganState(),
        info: { ...r.info },
        sanitasi: { ...r.sanitasi },
        anggota: r.anggota.map((m) => ({ ...m })),
        penilaian: r.penilaian.map((p) => ({ ...p, values: { ...p.values }, checks: { ...p.checks }, prioritas: [...p.prioritas] })),
        masalah: r.masalah.map((mm) => ({ ...mm })),
        hasil: r.hasil,
        jadwal: r.jadwal,
        ttd: r.ttd,
        fotos: r.fotos.map((f) => ({ ...f })),
      };
    }
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
        sanitasi: { ...EMPTY_SANITASI, jkn: true, ventilasi: true, jambanSaniter: "Kloset" },
        anggota: [
          { id: "demo-a1", nama: "Budi Setiawan", nik: "3579015202800001", tglLahir: "1980-02-15", jk: "L", hubKK: "Anak", statusKawin: "Kawin", pendidikan: "SMA", pekerjaan: "Buruh" },
          { id: "demo-a2", nama: "Siti Rahmawati", nik: "3579016202900002", tglLahir: "1990-02-16", jk: "P", hubKK: "Istri", statusKawin: "Kawin", pendidikan: "SMP", pekerjaan: "IRT" },
        ],
        penilaian: [
          { id: "demo-p1", anggotaId: "demo-a1", sasaran: "dewasa", values: { merokok: "Pasif", edukasiNakesTanggal: "2026-02-14" }, checks: { suhu: false, tdAdaObat: true, tdMinum24: false, gdAdaObat: false, gdMinum24: false }, prioritas: [] },
          { id: "demo-p2", anggotaId: "demo-a2", sasaran: "ibu-hamil", values: { nama: "Siti Rahmawati", umur: "36", kehamilanKe: "3", paraf: "Siti Rahmawati" }, checks: { bukuKia: true, ttdAda: true, ttdMinum: true, lilaRisiko: false }, prioritas: ["Bumil Risti"] },
        ],
        masalah: [
          { id: "demo-m1", nama: "Budi Setiawan", nik: "3579015202800001", tglLahir: "1980-02-15", alamat: "Jl. Ngemplakrejo gg. III no. 12", telepon: "081234567890", masalah: "Hipertensi tidak patuh berobat (ada obat tapi tidak minum 24 jam terakhir)", tindakLanjut: "Edukasi patuh minum obat & jadwal kontrol" },
        ],
        ttd: "Siti Aminah",
        hasil: HASIL_KUNJUNGAN[0],
        fotos: [],
      };
    }
    default:
      return state;
  }
}
