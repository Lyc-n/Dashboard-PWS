import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout'
import { ButtonLink, PageHeader, SectionCard } from '@/components/ui'
import { FormulirScene } from '@/components/survey/FormulirScene'
import { useAsyncData } from '@/hooks/use-async-data'
import { ambilFormulir } from '@/lib/api/server-fns'
import { pesanError } from '@/lib/utils'
import type { DefinisiRuntime } from '@/lib/server/survey/form-runtime.server'
import { requireAuth } from '@/lib/auth/auth'

export const Route = createFileRoute('/isi/$formVersionId')({
  beforeLoad: requireAuth,
  component: IsiFormulir,
})

/**
 * Halaman isi satu versi form.
 *
 * Definisi dimuat di dalam `useEffect`, bukan di `loader`, supaya kegagalan
 * `ambilFormulir` — versi sudah tidak tayang, form dinonaktifkan, id salah —
 * tampil sebagai pesan yang bisa dibaca petugas plus jalan kembali ke daftar,
 * bukan sebagai halaman error. Pola pemuatan dari server fn di_effect sudah dipakai
 * `src/hooks/kunjungan-rumah/use-kunjungan-rumah-template-db.ts`.
 *
 * Yang gagal dimuat TIDAK pernah diganti definisi bawaan: definisi form bukan
 * data konfigurasi frontend. Form tanpa definisi berarti tidak ada yang boleh
 * diisi, dan mengarang pertanyaan akan lebih berbahaya daripada menampilkan
 * halaman kosong.
 */
function IsiFormulir() {
  const { formVersionId } = Route.useParams()
  const {
    data: definisi,
    loading,
    error,
  } = useAsyncData<DefinisiRuntime | null>(
    () => ambilFormulir({ data: { formVersionId } }),
    [formVersionId],
    null,
    {
      mapError: (err: unknown) =>
        pesanError(err, 'Form tidak bisa dimuat. Coba lagi dari daftar form.'),
    },
  )

  if (loading) {
    return (
      <AppShell>
        <PageHeader title="Formulir" description="Memuat definisi formulir." />
        <p className="mt-3 text-[13px] text-muted">Memuat formulir…</p>
      </AppShell>
    )
  }

  if (error || !definisi) {
    return (
      <AppShell>
        <PageHeader
          title="Formulir"
          description="Formulir tidak bisa dibuka."
        />
        <SectionCard title="Formulir tidak tersedia">
          <div className="grid gap-2.5">
            <p className="text-[12.5px] text-danger">
              {error ?? 'Definisi form tidak ditemukan.'}
            </p>
            <p className="text-xs text-muted">
              Form bisa berubah status setelah halamannya dibuka: versi yang
              tayang bisa diganti atau formnya dinonaktifkan. Buka lagi dari
              daftar form yang tersedia.
            </p>
            <ButtonLink
              to="/form"
              search={{ jenis: '' }}
              variant="primary"
              className="w-fit"
            >
              Kembali ke daftar formulir
            </ButtonLink>
          </div>
        </SectionCard>
      </AppShell>
    )
  }

  return <FormulirScene formVersionId={formVersionId} definisi={definisi} />
}
