import { useCallback, useEffect, useState } from "react";
import {
  ambilEditorForm,
  daftarJenisField,
  buatDraftBuilder,
  buatFormBuilder,
  daftarVersiBuilder,
  hapusFormBuilder,
  listFormBuilder,
  terbitkanVersiBuilder,
} from "@/lib/utils.functions";
import type { ambilDefinisiVersi } from "@/features/form-builder/services/section.server";
import type { daftarVersiForm, listFormBaru } from "@/features/form-builder/services/form.server";

export type DefinisiVersi = Awaited<ReturnType<typeof ambilDefinisiVersi>>;
export type BarisVersi = Awaited<ReturnType<typeof daftarVersiForm>>[number];
export type BarisFormBaru = Awaited<ReturnType<typeof listFormBaru>>[number];

function pesanError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Gagal menyimpan perubahan form.";
}

/**
 * State tab Form Builder di /kelola.
 *
 * Alurnya mengikuti siklus versi form: pilih form, pilih versi, baru editor
 * dibuka. Versi `published` bisa dibaca tapi tidak bisa diubah, jadi `bisaUbah`
 * dihitung dari status versi dan dipakai komponen editor untuk mengunci tombol.
 *
 * Versi yang tayang otomatis dibuka kalau form belum pernah dibuka, supaya admin
 * tidak mendarat di layar kosong.
 */
export function useFormBuilder() {
  const [forms, setForms] = useState<BarisFormBaru[]>([]);
  const [formId, setFormId] = useState<number | null>(null);
  const [versi, setVersi] = useState<BarisVersi[]>([]);
  const [formVersionId, setFormVersionId] = useState<string | null>(null);
  const [definisi, setDefinisi] = useState<DefinisiVersi | null>(null);
  const [loadingForms, setLoadingForms] = useState(true);
  const [loadingDefinisi, setLoadingDefinisi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [definisiError, setDefinisiError] = useState<string | null>(null);
  const [semuaTipe, setSemuaTipe] = useState<readonly string[]>([]);
  const [butuhOpsi, setButuhOpsi] = useState<readonly string[]>([]);

  const versiTerpilih = versi.find((v) => v.id === formVersionId) ?? null;
  const bisaUbah = versiTerpilih?.status === "draft";

  // Daftar tipe dibaca dari server, bukan ditulis ulang di editor: backend yang
  // menolak field tanpa opsi, jadi dua daftar di tempat berbeda cepat tidak sinkron.
  useEffect(() => {
    void (async () => {
      try {
        const daftar = await daftarJenisField();
        setSemuaTipe(daftar.semua);
        setButuhOpsi(daftar.butuhOpsi);
      } catch {
        setError("Gagal memuat daftar tipe field.");
      }
    })();
  }, []);

  const muatForms = useCallback(async () => {
    setLoadingForms(true);
    setError(null);
    try {
      const daftar = await listFormBuilder();
      setForms(daftar);
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setLoadingForms(false);
    }
  }, []);

  useEffect(() => {
    void muatForms();
  }, [muatForms]);

  const muatDefinisi = useCallback(async (versionId: string) => {
    setLoadingDefinisi(true);
    setDefinisiError(null);
    try {
      setDefinisi(await ambilEditorForm({ data: { formVersionId: versionId } }));
    } catch (err) {
      setDefinisiError(pesanError(err));
      setDefinisi(null);
    } finally {
      setLoadingDefinisi(false);
    }
  }, []);

  const pilihForm = useCallback(
    async (id: number) => {
      setFormId(id);
      setFormVersionId(null);
      setDefinisi(null);
      setVersi([]);
      setError(null);
      setDefinisiError(null);
      setLoadingDefinisi(true);
      try {
        const daftar = await daftarVersiBuilder({ data: { formId: id } });
        setVersi(daftar);
        // Buka versi yang bisa diedit kalau ada; kalau tidak, versi terbaru saja
        // supaya form published yang belum pernah diutak-atik tetap terlihat.
        const draft = daftar.find((v) => v.status === "draft") ?? daftar[0];
        if (draft) {
          setFormVersionId(draft.id);
          setDefinisi(await ambilEditorForm({ data: { formVersionId: draft.id } }));
        } else {
          setDefinisi(null);
        }
      } catch (err) {
        setDefinisiError(pesanError(err));
        setDefinisi(null);
      } finally {
        setLoadingDefinisi(false);
      }
    },
    [],
  );

  const pilihVersi = useCallback(
    async (versionId: string) => {
      setFormVersionId(versionId);
      await muatDefinisi(versionId);
    },
    [muatDefinisi],
  );

  const buatForm = useCallback(
    async (nama: string, deskripsi: string) => {
      setSaving(true);
      setError(null);
      try {
        const hasil = await buatFormBuilder({ data: { nama, deskripsi } });
        await muatForms();
        await pilihForm(hasil.formId);
      } catch (err) {
        setError(pesanError(err));
      } finally {
        setSaving(false);
      }
    },
    [muatForms, pilihForm],
  );

  /** Jalankan satu tulis, lalu muat ulang definisi versi supaya layar ikut berubah. */
  const jalankan = useCallback(
    async (aksi: () => Promise<unknown>) => {
      setSaving(true);
      setError(null);
      try {
        await aksi();
        if (formVersionId) await muatDefinisi(formVersionId);
        if (formId) setVersi(await daftarVersiBuilder({ data: { formId } }));
      } catch (err) {
        setError(pesanError(err));
      } finally {
        setSaving(false);
      }
    },
    [formVersionId, formId, muatDefinisi],
  );

  const hapusForm = useCallback(
    async (id: number) => {
      setSaving(true);
      setError(null);
      try {
        await hapusFormBuilder({ data: { formId: id } });
        await muatForms();
        // Reset state setelah hapus
        setFormId(null);
        setFormVersionId(null);
        setDefinisi(null);
        setVersi([]);
      } catch (err) {
        setError(pesanError(err));
      } finally {
        setSaving(false);
      }
    },
    [muatForms],
  );

  const terbitkan = useCallback(
    () => (formVersionId ? jalankan(() => terbitkanVersiBuilder({ data: { formVersionId } })) : Promise.resolve()),
    [jalankan, formVersionId],
  );

  /**
   * Draft baru dibuat dari versi yang sedang dibuka. Versi published lama dibekukan,
   * jadi admin yang mau mengubah form tayang harus lewat sini.
   */
  const buatDraft = useCallback(async () => {
    if (!formId) return;
    await jalankan(async () => {
      const baru = await buatDraftBuilder({ data: { formId } });
      setFormVersionId(baru);
    });
    if (formId) {
      const daftar = await daftarVersiBuilder({ data: { formId } });
      setVersi(daftar);
    }
  }, [jalankan, formId]);

  return {
    forms,
    formId,
    versi,
    versiTerpilih,
    formVersionId,
    definisi,
    semuaTipe,
    butuhOpsi,
    loading: loadingForms,
    loadingDefinisi,
    definisiError,
    saving,
    error,
    bisaUbah,
    muatForms,
    pilihForm,
    pilihVersi,
    buatForm,
    hapusForm,
    terbitkan,
    buatDraft,
  };
}
