import { useCallback, useMemo, useState } from "react";
import { HASIL_KUNJUNGAN } from "@/lib/constants";
import type { SasaranKey } from "@/lib/kr-form";
import { sasaranDef } from "@/lib/kr-form";
import type { KrTemplates } from "@/lib/kr-templates";
import { seedKrTemplates } from "@/lib/kr-templates";

export interface AnggotaKeluarga {
  id: string;
  nama: string;
  nik: string;
  tglLahir: string;
  jk: string;
  hubKK: string;
  statusKawin: string;
  pendidikan: string;
  pekerjaan: string;
  [key: string]: string;
}

export interface PenilaianForm {
  id: string;
  anggotaId: string;
  sasaran: SasaranKey;
  values: Record<string, string>;
  checks: Record<string, boolean>;
  prioritas: string[];
}

export interface MasalahTindak {
  id: string;
  nama: string;
  nik: string;
  tglLahir: string;
  alamat: string;
  telepon: string;
  masalah: string;
  tindakLanjut: string;
  [key: string]: string;
}

export interface KeluargaInfo {
  tglPengumpulan: string;
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kabKota: string;
  provinsi: string;
  hpKK: string;
  puskesmas: string;
  pustu: string;
  posyandu: string;
  namaKK: string;
  [key: string]: string;
}

export interface Sanitasi {
  jkn: boolean;
  airBersih: boolean;
  jenisAir: string;
  jamban: boolean;
  jambanSaniter: boolean;
  ventilasi: boolean;
  odgj: boolean;
  tbc: boolean;
  hipertensi: boolean;
  dm: boolean;
  [key: string]: boolean | string;
}

export interface KunjunganRecord {
  info: KeluargaInfo;
  sanitasi: Sanitasi;
  anggota: AnggotaKeluarga[];
  penilaian: PenilaianForm[];
  masalah: MasalahTindak[];
  hasil: string;
  jadwal: string;
  ttd: string;
  waktuSimpan: string;
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

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
  jambanSaniter: false,
  ventilasi: false,
  odgj: false,
  tbc: false,
  hipertensi: false,
  dm: false,
};

const EMPTY_ANGGOTA: AnggotaKeluarga = {
  id: "",
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
  return {
    id: uid(),
    anggotaId,
    sasaran,
    values: {},
    checks: {},
    prioritas: [...prioritas],
  };
}

export function useKunjungan(templatesInput?: KrTemplates) {
  const templates = templatesInput ?? seedKrTemplates();
  const [info, setInfo] = useState<KeluargaInfo>({ ...EMPTY_INFO });
  const [sanitasi, setSanitasi] = useState<Sanitasi>({ ...EMPTY_SANITASI });
  const [anggota, setAnggota] = useState<AnggotaKeluarga[]>([]);
  const [penilaian, setPenilaian] = useState<PenilaianForm[]>([]);
  const [masalah, setMasalah] = useState<MasalahTindak[]>([]);
  const [hasil, setHasil] = useState<string>(HASIL_KUNJUNGAN[0]);
  const [jadwal, setJadwal] = useState("");
  const [ttd, setTtd] = useState("");
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});

  const setField = useCallback(<TKey extends keyof KeluargaInfo>(key: TKey, value: KeluargaInfo[TKey]) => {
    setInfo((f) => ({ ...f, [key]: value }));
  }, []);

  const setSanField = useCallback(<TKey extends keyof Sanitasi>(key: TKey, value: Sanitasi[TKey]) => {
    setSanitasi((s) => ({ ...s, [key]: value }));
  }, []);

  const addAnggota = useCallback(() => {
    setAnggota((a) => [...a, { ...EMPTY_ANGGOTA, id: uid() }]);
  }, []);

  const updateAnggota = useCallback(
    <TKey extends keyof AnggotaKeluarga>(id: string, key: TKey, value: AnggotaKeluarga[TKey]) => {
      setAnggota((a) => a.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
    },
    [],
  );

  const removeAnggota = useCallback((id: string) => {
    setAnggota((a) => a.filter((m) => m.id !== id));
    setPenilaian((p) => p.filter((n) => n.anggotaId !== id));
  }, []);

  const addPenilaian = useCallback(
    (anggotaId: string, sasaran: SasaranKey) => {
      setPenilaian((p) => [...p, emptyPenilaian(anggotaId, sasaran, templates)]);
    },
    [templates],
  );

  const removePenilaian = useCallback((id: string) => {
    setPenilaian((p) => p.filter((n) => n.id !== id));
  }, []);

  const setValue = useCallback((id: string, key: string, value: string) => {
    setPenilaian((p) => p.map((n) => (n.id === id ? { ...n, values: { ...n.values, [key]: value } } : n)));
  }, []);

  const setCheck = useCallback((id: string, key: string, checked: boolean) => {
    setPenilaian((p) => p.map((n) => (n.id === id ? { ...n, checks: { ...n.checks, [key]: checked } } : n)));
  }, []);

  const togglePrioritas = useCallback((id: string, prio: string) => {
    setPenilaian((p) =>
      p.map((n) =>
        n.id === id
          ? { ...n, prioritas: n.prioritas.includes(prio) ? n.prioritas.filter((x) => x !== prio) : [...n.prioritas, prio] }
          : n,
      ),
    );
  }, []);

  const addMasalah = useCallback(() => {
    setMasalah((m) => [
      ...m,
      { id: uid(), nama: "", nik: "", tglLahir: "", alamat: "", telepon: "", masalah: "", tindakLanjut: "" },
    ]);
  }, []);

  const updateMasalah = useCallback(
    <TKey extends keyof MasalahTindak>(id: string, key: TKey, value: MasalahTindak[TKey]) => {
      setMasalah((m) => m.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
    },
    [],
  );

  const removeMasalah = useCallback((id: string) => {
    setMasalah((m) => m.filter((r) => r.id !== id));
  }, []);

  const bahaCount = useMemo(
    () => penilaian.reduce((acc, n) => acc + Object.values(n.checks).filter(Boolean).length, 0),
    [penilaian],
  );

  const fillPercent = useMemo(() => {
    // dynamic: count required active fields filled
    const reqKeluarga = templates.keluargaInfo.filter((f) => f.active && f.required);
    const reqAnggota = templates.anggota.filter((f) => f.active && f.required);
    const reqMasalah = templates.masalah.filter((f) => f.active && f.required);
    let totalReq = reqKeluarga.length + reqMasalah.length + 2; // + hasil + ttd
    let filledReq = 0;
    for (const f of reqKeluarga) {
      const v = (info as Record<string, string>)[f.id] ?? "";
      if (String(v).trim()) filledReq++;
    }
    if (anggota.length > 0) {
      // each required anggota field must be filled for at least one anggota? count per member
      // For fillPercent we consider: if any anggota exists, count required per first member
      // More precise: totalReq includes per-member required * anggota count
      if (reqAnggota.length > 0 && anggota.length > 0) {
        totalReq += reqAnggota.length;
        const first = anggota[0] as Record<string, string>;
        for (const f of reqAnggota) {
          if (String(first[f.id] ?? "").trim()) filledReq++;
        }
      }
    } else if (reqAnggota.length > 0) {
      totalReq += reqAnggota.length;
    }
    // penilaian required per sasaran
    for (const p of penilaian) {
      const tpls = templates.sasaran[p.sasaran].fields.filter((f) => f.active && f.required);
      totalReq += tpls.length;
      for (const f of tpls) {
        if (f.kind === "checkbox") {
          if (p.checks[f.id]) filledReq++;
        } else {
          const v = p.values[f.id] ?? "";
          if (String(v).trim()) filledReq++;
        }
      }
    }
    if (penilaian.length === 0) {
      // at least one sasaran required
      totalReq += 1;
    }
    for (const f of reqMasalah) {
      if (masalah.length > 0) {
        const first = masalah[0] as Record<string, string>;
        if (String(first[f.id] ?? "").trim()) filledReq++;
      }
    }
    if (hasil.trim()) filledReq++;
    if (ttd.trim()) filledReq++;
    // baseline progress like old: ensure minimal count
    if (totalReq === 0) return 100;
    const base = Math.round((filledReq / totalReq) * 100);
    // also ensure at least fallback 0-100
    return Math.max(0, Math.min(100, base));
  }, [info, anggota, penilaian, masalah, hasil, ttd, templates]);

  const stepState = useMemo((): ("done" | "now" | "todo")[] => {
    const n = ttd.trim() ? 4 : penilaian.length > 0 ? 3 : anggota.length > 0 ? 2 : 1;
    return [1, 2, 3, 4].map((s) => (s < n ? "done" : s === n ? "now" : "todo"));
  }, [ttd, penilaian.length, anggota.length]);

  const validate = useCallback((): boolean => {
    const nextInvalid: Record<string, boolean> = {};
    let ok = true;
    // keluargaInfo required dynamic
    for (const f of templates.keluargaInfo.filter((x) => x.active && x.required)) {
      const v = (info as Record<string, string>)[f.id] ?? "";
      if (!String(v).trim()) {
        nextInvalid[f.id] = true;
        // keep legacy keys for UI compat
        if (f.id === "tglPengumpulan") nextInvalid.tgl = true;
        if (f.id === "posyandu") nextInvalid.posyandu = true;
        ok = false;
      }
    }
    // fallback legacy required if template has no required
    if (!info.tglPengumpulan) {
      if (!nextInvalid.tgl) {
        nextInvalid.tgl = true;
        ok = false;
      }
    }
    if (!info.posyandu.trim()) {
      if (!nextInvalid.posyandu) {
        nextInvalid.posyandu = true;
        ok = false;
      }
    }
    if (anggota.length === 0) {
      nextInvalid.anggota = true;
      ok = false;
    }
    const seen = new Set<string>();
    anggota.forEach((m) => {
      const rec = m as unknown as Record<string, string>;
      for (const f of templates.anggota.filter((x) => x.active && x.required)) {
        const v = rec[f.id] ?? "";
        if (!String(v).trim()) {
          nextInvalid[`${f.id}:${m.id}`] = true;
          ok = false;
        }
        // legacy nik 16 digit check
        if (f.id === "nik") {
          if (!/^\d{16}$/.test(rec.nik)) {
            nextInvalid[`nik:${m.id}`] = true;
            ok = false;
          } else if (seen.has(rec.nik)) {
            nextInvalid[`nik:${m.id}`] = true;
            ok = false;
          }
        }
      }
      // keep legacy nik duplicate check even if not required template
      if (!templates.anggota.find((f) => f.id === "nik" && f.required)) {
        if (!/^\d{16}$/.test(m.nik)) {
          nextInvalid[`nik:${m.id}`] = true;
          ok = false;
        } else if (seen.has(m.nik)) {
          nextInvalid[`nik:${m.id}`] = true;
          ok = false;
        }
      }
      if (seen.has(m.nik) === false) seen.add(m.nik);
      // legacy nama/tglLahir fallback if not covered
      if (!m.nama.trim()) {
        if (!nextInvalid[`nama:${m.id}`]) {
          // only if not already marked via template
          const hasNamaReq = templates.anggota.some((f) => f.id === "nama" && f.required);
          if (!hasNamaReq) {
            nextInvalid[`nama:${m.id}`] = true;
            ok = false;
          }
        }
      }
      if (!m.tglLahir) {
        const hasReq = templates.anggota.some((f) => f.id === "tglLahir" && f.required);
        if (!hasReq) {
          nextInvalid[`tglLahir:${m.id}`] = true;
          ok = false;
        }
      }
    });
    if (penilaian.length === 0) {
      nextInvalid.penilaian = true;
      ok = false;
    } else {
      for (const p of penilaian) {
        const fields = templates.sasaran[p.sasaran].fields.filter((f) => f.active && f.required);
        for (const f of fields) {
          if (f.kind === "checkbox") {
            // checkbox required means must be checked
            if (!p.checks[f.id]) {
              nextInvalid[`${p.id}:${f.id}`] = true;
              ok = false;
            }
          } else {
            const v = p.values[f.id] ?? "";
            if (!String(v).trim()) {
              nextInvalid[`${p.id}:${f.id}`] = true;
              ok = false;
            }
          }
        }
      }
    }
    // masalah required per field
    if (templates.masalah.some((f) => f.active && f.required) && masalah.length === 0) {
      nextInvalid.masalahRequired = true;
      ok = false;
    }
    for (const mm of masalah) {
      const rec = mm as unknown as Record<string, string>;
      for (const f of templates.masalah.filter((x) => x.active && x.required)) {
        if (!String(rec[f.id] ?? "").trim()) {
          nextInvalid[`masalah:${mm.id}:${f.id}`] = true;
          ok = false;
        }
      }
    }
    const hasilOpsi = templates.hasilOpsi;
    if (hasilOpsi.length > 0 && !hasilOpsi.includes(hasil)) {
      // if hasil not in opsi, invalid
      nextInvalid.hasil = true;
      ok = false;
    }
    if (hasil === hasilOpsi[1] && !jadwal) {
      nextInvalid.jadwal = true;
      ok = false;
    }
    if (!ttd.trim()) {
      nextInvalid.ttd = true;
      ok = false;
    }
    setInvalid(nextInvalid);
    return ok;
  }, [info, anggota, penilaian, masalah, hasil, jadwal, ttd, templates]);

  const submit = useCallback((): KunjunganRecord | null => {
    if (!validate()) return null;
    return {
      info: { ...info },
      sanitasi: { ...sanitasi },
      anggota: anggota.map((m) => ({ ...m })),
      penilaian: penilaian.map((n) => ({ ...n, values: { ...n.values }, checks: { ...n.checks }, prioritas: [...n.prioritas] })),
      masalah: masalah.map((m) => ({ ...m })),
      hasil,
      jadwal,
      ttd,
      waktuSimpan: new Date().toISOString(),
    };
  }, [validate, info, sanitasi, anggota, penilaian, masalah, hasil, jadwal, ttd]);

  const reset = useCallback(() => {
    setInfo({ ...EMPTY_INFO });
    setSanitasi({ ...EMPTY_SANITASI });
    setAnggota([]);
    setPenilaian([]);
    setMasalah([]);
    setHasil(HASIL_KUNJUNGAN[0]);
    setJadwal("");
    setTtd("");
    setInvalid({});
  }, []);

  const fillDemo = useCallback(() => {
    setInfo({
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
    });
    setSanitasi({ ...EMPTY_SANITASI, jkn: true, airBersih: true, jamban: true, ventilasi: true });
    setAnggota([
      { id: "demo-a1", nama: "Budi Setiawan", nik: "3579015202800001", tglLahir: "1980-02-15", jk: "L", hubKK: "Anak", statusKawin: "Kawin", pendidikan: "SMA", pekerjaan: "Buruh" },
      { id: "demo-a2", nama: "Siti Rahmawati", nik: "3579016202900002", tglLahir: "1990-02-16", jk: "P", hubKK: "Istri", statusKawin: "Kawin", pendidikan: "SMP", pekerjaan: "IRT" },
    ]);
    const dewasa: PenilaianForm = {
      id: "demo-p1",
      anggotaId: "demo-a1",
      sasaran: "dewasa",
      values: { suhu: "36.5", tdAdaObat: "Ya", tdMinum24: "Tidak", gdAdaObat: "Tidak", merokok: "Pasif" },
      checks: { tdPeriksaSetahun: true, tdPeriksaSebulan: true, skriningJiwa: false, edukasi: true, paraf: true },
      prioritas: [],
    };
    const bumil: PenilaianForm = {
      id: "demo-p2",
      anggotaId: "demo-a2",
      sasaran: "ibu-hamil",
      values: { nama: "Siti Rahmawati", umur: "36", kehamilanKe: "3" },
      checks: { bukuKia: true, ttdAda: true, ttdMinum: true, skriningJiwa: false, paraf: true },
      prioritas: ["Bumil Risti"],
    };
    setPenilaian([dewasa, bumil]);
    setMasalah([
      {
        id: "demo-m1",
        nama: "Budi Setiawan",
        nik: "3579015202800001",
        tglLahir: "1980-02-15",
        alamat: "Jl. Ngemplakrejo gg. III no. 12",
        telepon: "081234567890",
        masalah: "Hipertensi tidak patuh berobat (ada obat tapi tidak minum 24 jam terakhir)",
        tindakLanjut: "Edukasi patuh minum obat & jadwal kontrol",
      },
    ]);
    setTtd("Siti Aminah");
    setInvalid({});
  }, []);

  return {
    info,
    setField,
    sanitasi,
    setSanField,
    anggota,
    addAnggota,
    updateAnggota,
    removeAnggota,
    penilaian,
    addPenilaian,
    removePenilaian,
    setValue,
    setCheck,
    togglePrioritas,
    masalah,
    addMasalah,
    updateMasalah,
    removeMasalah,
    hasil,
    setHasil,
    jadwal,
    setJadwal,
    ttd,
    setTtd,
    invalid,
    bahaCount,
    fillPercent,
    stepState,
    validate,
    submit,
    reset,
    fillDemo,
  };
}