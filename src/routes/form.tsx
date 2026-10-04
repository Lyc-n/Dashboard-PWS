import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/organisms";
import { PageHeader, SectionCard } from "@/components/molecules";
import { Badge, EmptyState } from "@/components/atoms";
import { useAsyncData } from "@/hooks/use-async-data";
import { listFormulir } from "@/lib/utils.functions";
import type { BarisFormulirTerisi } from "@/features/survey/services/form-runtime.server";
import { requireAuth } from "@/lib/auth";

export const Route = createFileRoute("/form")({
  beforeLoad: requireAuth,
  component: DaftarFormulir,
});

/**
 * `jumlahSection` dan `jumlahField` dihitung server dengan `count(*)`, dan
 * postgres-js mengirim hasil agregat itu sebagai teks. Tipe yang ditulis di
 * `BarisFormulirTerisi` tetap `number`, jadi angkanya dikonversi di sini supaya
 * tampilan tidak pernah menampilkan "13 section" untuk form yang punya 13 section.
 */
function jumlah(nilai: number): number {
  const angka = Number(nilai);
  return Number.isFinite(angka) ? angka : 0;
}

/**
 * Daftar form yang sedang bisa diisi.
 *
 * Isinya persis "form yang tayang": `daftarFormulirTerisi` hanya mengembalikan
 * form aktif yang punya satu versi `published`, jadi form baru yang diterbitkan
 * admin langsung muncul di sini tanpa perubahan kode. Tidak ada nama form yang
 * ditulis di file ini.
 */
function DaftarFormulir() {
  const { data: rows, loading, error } = useAsyncData(
    () => listFormulir(),
    [],
    [] as BarisFormulirTerisi[],
    {
      mapError: (err: unknown) => (err instanceof Error && err.message ? err.message : "Gagal memuat daftar form."),
    },
  );

  return (
    <AppShell>
      <PageHeader
        title="Formulir"
        description="Form yang bisa diisi sekarang. Daftar ini mengikuti versi yang sudah diterbitkan di Kelola, jadi isinya selalu sama dengan yang ada di layar isi."
      />

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {loading ? <p className="mt-3 text-[13px] text-muted">Memuat daftar form…</p> : null}

      {!loading && rows.length === 0 ? (
        <EmptyState title="Belum ada form yang bisa diisi." className="mt-3.5">
          <p>
            Form baru akan muncul di sini setelah Admin menyusun pertanyaannya lalu menerbitkannya di
            Kelola. Form yang belum diterbitkan tidak bisa diisi.
          </p>
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <SectionCard title="Form yang bisa diisi" sub="Pilih form untuk mulai mengisi.">
          <ul className="grid gap-2">
            {rows.map((row) => (
              <li key={row.formVersionId}>
                <Link
                  to="/isi/$formVersionId"
                  params={{ formVersionId: row.formVersionId }}
                  className="grid gap-1 rounded-lg border border-line bg-surface px-3 py-2.5 hover:border-accent"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <b className="text-[13px] text-ink">{row.nama}</b>
                    <Badge variant="ok">Versi {row.version}</Badge>
                  </span>
                  {row.deskripsi ? <span className="text-[12px] text-muted">{row.deskripsi}</span> : null}
                  <span className="text-[11px] text-muted">
                    {jumlah(row.jumlahSection)} section · {jumlah(row.jumlahField)} pertanyaan
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </AppShell>
  );
}
