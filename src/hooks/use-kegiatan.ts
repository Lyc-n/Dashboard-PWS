import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JENIS_KEGIATAN } from "@/lib/constants";

export interface Peserta {
  nama: string;
  kel: string;
  hadir: boolean;
}

export interface Foto {
  url: string;
  cap: string;
}

export interface KegiatanFieldState {
  nama: string;
  pj: string;
  tgl: string;
  jam: string;
  target: string;
  kel: string;
  posy: string;
  lokasi: string;
  deskripsi: string;
}

export interface KegiatanRecord extends KegiatanFieldState {
  jenis: string;
  hadir: number;
  total: number;
  foto: number;
}

const REQUIRED = ["nama", "pj", "tgl", "kel", "lokasi"] as const;
const MAX_FOTO = 6;
const MAX_SIZE = 2 * 1024 * 1024;

export function useKegiatan() {
  const [jenis, setJenis] = useState<string>(JENIS_KEGIATAN[0]);
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const fotosRef = useRef<Foto[]>([]);
  // cermin fotos untuk addFiles tanpa closure basi + cleanup unmount
  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);
  useEffect(() => {
    const ref = fotosRef;
    return () => {
      ref.current.forEach((x) => URL.revokeObjectURL(x.url));
      ref.current = [];
    };
  }, []);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [pesertaEmpty, setPesertaEmpty] = useState(false);
  const [fields, setFields] = useState<KegiatanFieldState>({
    nama: "",
    pj: "",
    tgl: "2026-02-14",
    jam: "09:00",
    target: "",
    kel: "",
    posy: "",
    lokasi: "",
    deskripsi: "",
  });

  const setField = useCallback(<TKey extends keyof KegiatanFieldState>(key: TKey, value: KegiatanFieldState[TKey]) => {
    setFields((f) => ({ ...f, [key]: value }));
  }, []);

  const addPeserta = useCallback((nama: string, kel: string, hadir: boolean) => {
    setPeserta((p) => [...p, { nama, kel, hadir }]);
    setPesertaEmpty(false);
  }, []);

  const togglePeserta = useCallback((i: number, hadir: boolean) => {
    setPeserta((p) => p.map((x, idx) => (idx === i ? { ...x, hadir } : x)));
  }, []);

  const removePeserta = useCallback((i: number) => {
    setPeserta((p) => p.filter((_, idx) => idx !== i));
  }, []);

  const addFiles = useCallback((files: File[]): number => {
    let skipped = 0;
    const next: Foto[] = [];
    // baca via ref agar panggilan cepat beruntun tidak pakai length basi
    for (const file of files) {
      const mime = file.type.toLowerCase();
      const isSvg = mime === "image/svg+xml" || mime === "image/svg" || file.name.toLowerCase().endsWith(".svg");
      if (fotosRef.current.length + next.length >= MAX_FOTO || file.size > MAX_SIZE || file.size <= 0 || !file.type.startsWith("image/") || isSvg) {
        skipped++;
        continue;
      }
      next.push({ url: URL.createObjectURL(file), cap: "" });
    }
    if (next.length > 0) setFotos((f) => [...f, ...next]);
    return skipped;
  }, []);

  const setCaption = useCallback((i: number, cap: string) => {
    setFotos((f) => f.map((x, idx) => (idx === i ? { ...x, cap } : x)));
  }, []);

  const removeFoto = useCallback((i: number) => {
    setFotos((f) => {
      const target = f[i];
      if (target) URL.revokeObjectURL(target.url);
      return f.filter((_, idx) => idx !== i);
    });
  }, []);

  const hadirCount = useMemo(() => peserta.filter((p) => p.hadir).length, [peserta]);

  const fillPercent = useMemo(() => {
    let fill = 0;
    const total = REQUIRED.length + 1;
    REQUIRED.forEach((k) => {
      if (fields[k].trim()) fill++;
    });
    if (peserta.length) fill++;
    return Math.round((fill / total) * 100);
  }, [fields, peserta.length]);

  const validate = useCallback((): boolean => {
    const nextInvalid: Record<string, boolean> = {};
    let ok = true;
    REQUIRED.forEach((k) => {
      if (!fields[k].trim()) {
        nextInvalid[k] = true;
        ok = false;
      }
    });
    if (!peserta.length) {
      setPesertaEmpty(true);
      ok = false;
    }
    setInvalid(nextInvalid);
    return ok;
  }, [fields, peserta.length]);

  const submit = useCallback((): KegiatanRecord | null => {
    if (!validate()) return null;
    return { ...fields, jenis, hadir: hadirCount, total: peserta.length, foto: fotos.length };
  }, [validate, fields, jenis, hadirCount, peserta.length, fotos.length]);

  const clearAll = useCallback(() => {
    setFields({ nama: "", pj: "", tgl: "2026-02-14", jam: "09:00", target: "", kel: "", posy: "", lokasi: "", deskripsi: "" });
    setPeserta([]);
    setFotos((f) => {
      f.forEach((x) => URL.revokeObjectURL(x.url));
      return [];
    });
    setInvalid({});
    setPesertaEmpty(false);
  }, []);

  const loadDemo = useCallback(() => {
    setFields((f) => ({
      ...f,
      nama: "Penyuluhan Gizi Balita",
      pj: "Siti Aminah",
      kel: "Trajeng",
      posy: "Melati 1",
      lokasi: "Balai RW 02",
      deskripsi: "Edukasi MPASI dan demo menu isi piringku untuk 25 ibu balita.",
    }));
    setPeserta([
      { nama: "Ibu Warsini", kel: "Trajeng", hadir: true },
      { nama: "Ibu Lastri", kel: "Trajeng", hadir: true },
      { nama: "Ibu Ningsih", kel: "Ngemplakrejo", hadir: false },
    ]);
  }, []);

  return {
    fields,
    setField,
    jenis,
    setJenis,
    peserta,
    addPeserta,
    togglePeserta,
    removePeserta,
    hadirCount,
    fotos,
    addFiles,
    setCaption,
    removeFoto,
    invalid,
    pesertaEmpty,
    fillPercent,
    validate,
    submit,
    clearAll,
    loadDemo,
  };
}