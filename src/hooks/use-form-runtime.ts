/**
 * State halaman isi form generik.
 *
 * Dipisah dari `FormulirScene` supaya isian form yang panjang bisa diuji tanpa
 * merender. Yang dipegang hook ini persis yang dibutuhkan satu isian: jawaban
 * per `fieldId`, petugas pencatat, warga yang ditunjuk (kalau formnya mewajibkan),
 * tanggal, pencarian warga, dan daur kirim.
 *
 * MENGAPA JAWABAN DI-KEY `fieldId`, BUKAN `field.nama`
 * ---------------------------------------------------
 * `survey_entries` menyimpan `fieldId` dan `simpanFormulir` menolak id yang bukan
 * field versi ini. `form_fields.nama` boleh diganti admin kapan saja, sedangkan
 * `form_fields.id` tidak pernah berubah dalam satu versi — jadi `fieldId` satu-
 *-satunya kunci yang aman. Tidak ada nama field, `forms.kode`, atau nama form
 * yang ditulis di file ini.
 *

 * JAWABAN KOSONG TETAP DISIMPAN DI STATE
 * --------------------------------------
 * Nilai `null`, `undefined`, `""`, atau `[]` dibuang hanya saat payload dirakit,
 * bukan saat pengetikan. Kalau kuncinya dihapus dari state, input terkontrol
 * kehilangan `value`-nya dan berubah jadi tidak terkontrol — ketikan berikutnya
 * masuk ke satu input, bukan ke input yang diklik. `0` dan `false` TIDAK pernah
 * dianggap kosong: keduanya jawaban yang sah untuk field `number`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { simpanFormulir, cariSasaranWarga } from "@/lib/utils.functions";
import { hariIni, pesanError } from "@/lib/utils";
import type {
  DefinisiRuntime,
  FieldRuntime,
  HasilSimpanFormulir,
  SectionRuntime,
} from "@/features/survey/services/form-runtime.server";
import type { SasaranSuggestion } from "@/features/kunjungan-rumah/lib/warga-row";
import { usePetugasOpsi } from "@/hooks/use-petugas-opsi";

/** Panjang ketikan minimum sebelum server mencari warga; 3 sudah cukup unik. */
const MIN_KETIK_WARGA = 3;
/** Tunda pencarian warga supaya satu ketikan tidak jadi satu round-trip. */
const DEBOUNCE_WARGA_MS = 300;

/**
 * Nilai bawaan dibuat di module scope, bukan di dalam hook: objek dan array ini
 * dibaca banyak render dan tidak pernah dimutasi, jadi satu instance cukup.
 * `reset` memakai kembali konstanta yang sama, bukan membuat objek baru.
 */
const PETUGAS_KOSONG = "";
const WARGA_KOSONG = "";
const CARI_KOSONG = "";
const TANGGAL_AWAL = hariIni();
const SARAN_KOSONG: SasaranSuggestion[] = [];
const ANSWER_KOSONG: Record<string, unknown> = {};
const SECTION_KOSONG: SectionRuntime[] = [];

/**
 * `''`, `null`, `undefined`, dan daftar kosong dianggap belum mengisi.
 *
 * `0` dan `false` sengaja TIDAK ikut: keduanya jawaban yang sah, dan
 * membuangnya berarti isian yang benar hilang dari payload.
 */
export function nilaiKosong(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Berapa field wajib yang masih kosong. `0` dan `false` dihitung terisi. */
function hitungKosong(fields: readonly FieldRuntime[], answers: Record<string, unknown>): number {
  let kosong = 0
  for (const field of fields) {
    if (nilaiKosong(answers[field.id])) kosong += 1
  }
  return kosong
}

export interface UseFormRuntimeParams {
  formVersionId: string
  definisi: DefinisiRuntime
  /** Dipanggil sekali setelah isian benar-benar tersimpan di server. */
  onSaved?: (hasil: HasilSimpanFormulir) => void;
}

export function useFormRuntime({ formVersionId, definisi, onSaved }: UseFormRuntimeParams) {
  const { form, sections, version } = definisi
  const subjekWargaWajib = form.subjekWargaWajib

  const [answers, setAnswers] = useState<Record<string, unknown>>(ANSWER_KOSONG)
  const [petugasId, setPetugasId] = useState<string>(PETUGAS_KOSONG)
  const [wargaNik, setWargaNik] = useState<string>(WARGA_KOSONG)
  const [warga, setWarga] = useState<SasaranSuggestion | null>(null)
  const [tanggal, setTanggal] = useState<string>(TANGGAL_AWAL)
  const [cariWarga, setCariWarga] = useState<string>(CARI_KOSONG)
  const [saranWarga, setSaranWarga] = useState<SasaranSuggestion[]>(SARAN_KOSONG)
  const [mencariWarga, setMencariWarga] = useState(false)
  const [saranError, setSaranError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<HasilSimpanFormulir | null>(null)
  /**
   * Sudah pernah menekan Simpan.
   *
   * Hanya dipakai untuk menyalakan penandaan wajib di scene. Sebelum percobaan
   * pertama, form panjang akan tampil penuh merah dan itu hanya teaches user
   * bahwa ada kesalahan sebelum dia mencoba apa pun.
   */
  const [percobaanKirim, setPercobaanKirim] = useState(false)

  const petugas = usePetugasOpsi()

  const allFields = useMemo(() => sections.flatMap((section) => section.fields), [sections])

  /** Jawaban yang benar-benar dikirim: nilai kosong dibuang, sisanya utuh. */
  const terkirim = useMemo(() => {
    const peta = new Map<string, unknown>()
    for (const field of allFields) {
      const value = answers[field.id]
      if (value !== undefined && !nilaiKosong(value)) peta.set(field.id, value)
    }
    return peta
  }, [allFields, answers])

  /**
   * Section yang punya pertanyaan. Section kosong tidak dirender, jadi petugas
   * tidak lewat judul section yang tidak berisi apa pun.
   */
  const visibleSections = useMemo<SectionRuntime[]>(() => {
    if (sections.length === 0) return SECTION_KOSONG
    const hasil = sections
      .map((section) => ({
        ...section,
        fields: section.fields.filter((f) => f.aktif),
      }))
      .filter((section) => section.fields.length > 0)
    return hasil.length === 0 ? SECTION_KOSONG : hasil
  }, [sections])

  /** Field wajib yang sedang terlihat. */
  const fieldsWajib = useMemo(() => allFields.filter((f) => f.wajib), [allFields])

  const kosongWajib = useMemo(() => hitungKosong(fieldsWajib, answers), [fieldsWajib, answers])

  /** Field wajib pertama yang masih kosong; scene memakainya untuk menggulir ke sana. */
  const firstMissingRequiredId = useMemo(() => {
    for (const field of fieldsWajib) {
      if (nilaiKosong(answers[field.id])) return field.id
    }
    return null
  }, [fieldsWajib, answers])

  const fillPercent =
    fieldsWajib.length === 0 ? 100 : Math.round(((fieldsWajib.length - kosongWajib) / fieldsWajib.length) * 100)

  const setAnswer = useCallback((fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  // --- pencarian warga ------------------------------------------------------
  // Pakai `cariSasaranWarga`, query yang sama dengan form Kunjungan Rumah, supaya
  // tidak ada pencarian warga kedua yang hasilnya bisa berbeda.
  useEffect(() => {
    const q = cariWarga.trim()
    if (q.length < MIN_KETIK_WARGA) {
      setSaranWarga(SARAN_KOSONG)
      setSaranError(null)
      return
    }
    let hidup = true
    setMencariWarga(true)
    const timer = setTimeout(() => {
      void cariSasaranWarga({ data: { q } })
        .then((rows) => {
          if (!hidup) return
          setSaranWarga(rows)
          setSaranError(null)
        })
        .catch((err: unknown) => {
          if (!hidup) return
          setSaranWarga(SARAN_KOSONG)
          setSaranError(pesanError(err, "Gagal mencari warga di Data Sasaran."))
        })
        .finally(() => {
          if (hidup) setMencariWarga(false)
        })
    }, DEBOUNCE_WARGA_MS)
    return () => {
      hidup = false
      clearTimeout(timer)
    }
  }, [cariWarga])

  const pilihWarga = useCallback((row: SasaranSuggestion) => {
    setWargaNik(row.nik)
    setWarga(row)
    setCariWarga(CARI_KOSONG)
    setSaranWarga(SARAN_KOSONG)
  }, [])

  /**
   * NIK ditulis manual di kotak pencarian tanpa memilih suggestion. Pilihan warga
   * yang sebelumnya terisi ikut dibuang, karena NIK baru belum tentu warga yang sama.
   */
  const ketikWargaNik = useCallback((nik: string) => {
    setWargaNik(nik)
    setWarga(null)
  }, [])


  // --- kirim ---------------------------------------------------------------
  const jawaban = useMemo(
    () =>
      [...terkirim.entries()].map(([fieldId, value]) => ({ fieldId, value })),
    [terkirim],
  )

  /**
   * Simpan isian lewat `simpanFormulir`.
   *
   * Petugas, warga, dan tanggal dicek dulu supaya permintaan yang jelas-jelas
   * belum lengkap tidak dikirim. Sisanya — bentuk nilai, keanggotaan opsi, field
   * wajib yang kosong, versi yang sudah tidak tayang — dicek server dari definisi
   * yang dimuat ulang, dan pesannya yang sampai ke layar.
   */
  const submit = useCallback(async (): Promise<HasilSimpanFormulir | null> => {
    setPercobaanKirim(true)
    if (petugasId.trim() === '') {
      setError('Pilih petugas pencatat dulu. Nama petugas ikut tersimpan di database.')
      return null
    }
    if (subjekWargaWajib && wargaNik.trim() === '') {
      setError('Form ini wajib menunjuk satu warga. Pilih warga dari Data Sasaran dulu.')
      return null
    }
    if (nilaiKosong(tanggal)) {
      setError('Tanggal isian wajib diisi.')
      return null
    }

    setSaving(true)
    setError(null)
    try {
      // POST: payload wajib dibungkus `data`, sama seperti `cariSasaranWarga` dan
      // `saveKunjunganRumah` — server fn tanpa `.input()`/GET menolak argumen datar.
      const hasil = await simpanFormulir({
        data: {
          formVersionId,
          petugasId,
          wargaNik: subjekWargaWajib ? wargaNik : null,
          tanggal,
          jawaban,
        },
      })
      setSaved(hasil)
      onSaved?.(hasil)
      return hasil
    } catch (err) {
      setError(pesanError(err, 'Gagal menyimpan isian form. Coba lagi.'))
      return null
    } finally {
      setSaving(false)
    }
  }, [formVersionId, petugasId, subjekWargaWajib, wargaNik, tanggal, jawaban, onSaved])

  /** Kembali ke isian kosong untuk form yang sama, tanpa memuat ulang definisi. */
  const reset = useCallback(() => {
    setAnswers(ANSWER_KOSONG)
    setPetugasId(PETUGAS_KOSONG)
    setWargaNik(WARGA_KOSONG)
    setWarga(null)
    setCariWarga(CARI_KOSONG)
    setSaranWarga(SARAN_KOSONG)
    setSaranError(null)
    setTanggal(hariIni())
    setError(null)
    setSaved(null)
    setPercobaanKirim(false)
  }, [])

  return {
    form,
    version,
    sections,
    /** Jawaban lokal per `fieldId`; nilai kosong sengaja tetap ada di sini. */
    answers,
    setAnswer,
    visibleSections,
    fieldsWajib,
    /** `null` kalau semua field wajib yang terlihat sudah terisi. */
    firstMissingRequiredId,
    /** Berapa field wajib yang terlihat masih kosong. */
    kosongWajib,
    fillPercent,
    /** true setelah Simpan ditekan sekali; penanda wajib menyala dari situ. */
    percobaanKirim,
    petugasId,
    setPetugasId,
    petugasOpsi: petugas.petugasOpsi,
    petugasLoading: petugas.loading,
    petugasError: petugas.error,
    subjekWargaWajib,
    wargaNik,
    ketikWargaNik,
    warga,
    pilihWarga,
    cariWarga,
    setCariWarga,
    saranWarga,
    mencariWarga,
    saranError,
    tanggal,
    setTanggal,
    submit,
    saving,
    error,
    saved,
    reset,
  }
}
