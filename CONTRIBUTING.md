# Contributing to Dashboard-PWS

Stack: TanStack Start (React 19 + Nitro + Vite 8) + TanStack Router (file routes) + Drizzle ORM (Postgres) + Tailwind CSS v4 + Vitest.

## Quick start

```bash
pnpm install
pnpm dev               # vite dev --port 3000
pnpm test              # vitest run
pnpm lint              # eslint
pnpm format            # prettier --write . && eslint --fix
pnpm check             # tsc --noEmit && prettier --check .  -> jalankan sebelum commit
pnpm generate-routes   # tsr generate -> src/routeTree.gen.ts
pnpm build
```

Env: `DATABASE_URL` (server-only), `SECRET_KEY` (base64, JWT via `jose`), `PIN` (login PIN). `VITE_*` prefix = ikut ter-bundle ke browser, lihat `envPrefix` di `vite.config.ts`. Salin `.env.example` ke `.env` saat setup.

Sebelum edit besar, ikuti blok di `AGENTS.md`: `npx @tanstack/intent@latest list`, lalu load skill yang cocok.

## Codebase map

```
src/
  router.tsx                  # getRouter(): createTanStackRouter({ routeTree, scrollRestoration })
  routeTree.gen.ts            # GENERATED - jangan diedit (regen: pnpm generate-routes)
  styles.css                  # Tailwind v4 @theme tokens, fonts (Fraunces/Manrope)
  routes/                     # File-based routes, semua dijaga requireAuth kecuali pin + __root
    __root.tsx                # HTML shell, THEME_INIT_SCRIPT, AuthProvider + ToastProvider
    pin.tsx                   # /pin login PIN (redirect ke / kalau sesi sudah ada)
    index.tsx                 # / dashboard
    sasaran.tsx               # /sasaran layout + AppShell + Outlet
    sasaran.index.tsx         # /sasaran/ daftar warga (filter, pagination, ekspor CSV)
    sasaran.$id.tsx           # /sasaran/$id detail per NIK
    kunjungan-rumah.tsx       # /kunjungan-rumah form baru
    kunjungan-rumah.$id.tsx   # /kunjungan-rumah/$id buka/ubah record tersimpan
    kegiatan.tsx              # /kegiatan wizard kegiatan Posyandu
    laporan.tsx               # /laporan tabs kunjungan / kegiatan / rekap / riwayat submit
    kelola.tsx                # /kelola admin: Form Builder + daftar petugas
    form.tsx                  # /form daftar form
    isi.$formVersionId.tsx     # /isi/$formVersionId isi form dari Form Builder
  lib/
    schema/                   # Sumber kebenaran DB, TIGA file: schema.ts, data-import.ts, type-enum.ts
    db.server.ts              # Klien Drizzle (postgres-js, prepare:false)
    utils.functions.ts        # Batas createServerFn (42 fn) - client hanya boleh memanggil ini
    utils.server.ts           # Implementasi server: session/JWT, query, simpan/list
    user-registry.server.ts   # Daftar kader (tabel users, murni data referensi)
    auth.ts                   # AuthUser, SESSION_PROFILE, requireAuth()  <- TIDAK ada requireAdmin
    constants.ts              # KELS, PRIOS, POSY, JENIS_KEGIATAN, KODE_FORM_BAWAAN, TTL sesi, batas foto
    nav.ts                    # NAV_ITEMS + navItemsForUser / bottomNavItemsForUser
    utils.ts                  # cn(), PILL_STYLES, fmtDate, downloadCsv, normalkanNik, pesanError
    theme.ts                  # readThemeMode/applyThemeMode/THEME_INIT_SCRIPT
    hasil.ts                  # hasilKind() classifier
    events.ts, enum-values.ts, nav-forms-cache.ts, staff.ts  # staff.ts = bentuk rekap, bukan akun
    kunjungan-rumah-form.ts       # Definisi sasaran statis (SASARAN_KEYS)
    kunjungan-rumah-templates.ts  # Template KR lokal + engine parsing baris DB
    rekap-kunjungan-rumah.ts      # Engine rekap murni
    pin-attempt.ts             # Rate limit percobaan PIN
    uji-db.ts                 # Helper koneksi uji
    supabase-storage.ts        # Unggah foto ke bucket; DB menyimpan URL, bukan base64
  providers/
    auth.tsx                  # AuthProvider/useAuth (profil dari router context)
    toast.tsx                 # ToastProvider/useToast()
  hooks/                      # 15 hook; pakai useAsyncData sebagai basis async state
    use-async-data.ts             # Hook dasar: epoch-based cancellation + mapError
    use-form-runtime.ts            # Runtime form generik (DynamicField)
    use-form-builder.ts            # Aksi editor
    use-form-builder-draft.ts      # State draft Form Builder
    use-kunjungan-rumah-records.ts, use-kunjungan-rumah-template-db.ts,
    use-kunjungan-rumah-templates.ts
    use-kegiatan.ts, use-kegiatan-records.ts
    use-kader-aktif.ts, use-petugas-opsi.ts, use-user-registry.ts
    use-rekap-kunjungan-rumah.ts
    use-local-storage.ts, use-media-query.ts
  components/                 # Atomic design, import lewat barrel (index.ts)
    atoms/                    # Avatar, Badge, Button, Checkbox, Chip, EmptyState, Input,
                              # LogoEmblem, Pill, ProgressBar, RadioCard, Select, StatusBadge,
                              # Tab, Tag, Textarea
    molecules/                # Breadcrumb, Card, CardHeader, ChipGroup, DocCard, DropZone,
                              # FillBar, FormField, HistoryRow, PageHeader, Pagination,
                              # ProfileBox, SectionCard, StatCard, Stepper, TimelineItem, Toolbar
    organisms/                # AppShell, Sidebar, Topbar, BottomNav, DataTable, FilterCard,
                              # KelurahanSection, DetailHeader, InfoPanel, HistoryPanel,
                              # Timeline, PesertaPanel, DokumentasiPanel, SuccessPanel
    ui/CollapsibleSection.tsx # Section yang bisa dilipat (tanpa barrel)
    ThemeToggle.tsx
  features/                   # Logika domain, menjaga routes tetap tipis
    survey/
      components/             # DynamicField, FormulirScene, FieldCariWarga, SaranWargaDropdown
      services/               # form-runtime.server.ts (794 baris), kegiatan.server.ts
      lib/format-jawaban.ts
    kunjungan-rumah/         # Generasi-1, MASIH PRODUKSI - baca "Generasi domain" di bawah
      components/             # KunjunganRumahFormScene, KeluargaInfoSection, AnggotaSection,
                              # SanitasiSection, SasaranListSection, SasaranForm, MasalahSection,
                              # HasilSection, SaveBar, HistorySection, FieldCell
      store/                  # kunjunganRumahReducer.ts, kunjunganRumahSelectors.ts
      services/               # validateKunjunganRumah.ts, progress.ts, conditional.ts
      lib/                    # fotos.ts, template-from-rows.ts, warga-row.ts
      hooks/useKunjunganRumahForm.ts
      types.ts, models.ts
    form-builder/
      lib/kode-bawaan.ts      # Penjaga struktur form bawaan (kunci editor + tolak draft)
      services/               # form, form-version, section, opsi, option-source, build, audit
                              # + validasi.ts, sumber-opsi.ts, template-field.ts, masking.ts
    kelola/
      components/             # FormBuilderSection, UserSection, AdminModal, ConfirmModal,
                              # HapusFormDialog
      components/builder/     # FormBuilderWorkspace, BlockPalette, FieldNode, SectionNode,
                              # KontenDrag, SettingsPanel, BuildOverlay, tree.ts, ikon-builder.ts
      components/builder/preview/  # PratinjauOverlay, draft-ke-runtime.ts
    laporan/
      components/             # KopSurat, KopBrandRow, KopSection, KopTable, FilterToolbar,
                              # KelStatsGrid, TandaTangan, report-shared.ts
      RekapKunjunganRumahSection.tsx, RiwayatSubmitSection.tsx, report-filter.ts
    dashboard/                # KegiatanTrendChart, KegiatanTrendTooltip, useKegiatanTrend
  assets/                     # brand.png, brandIcon.png
drizzle/                      # Lihat "Migrasi database" di bawah
scripts/                      # Lihat tabel script
```

Config: `vite.config.ts` (tanstackStart + nitro + tailwindcss), `drizzle.config.ts` (`schema ./src/lib/schema/*.ts`, `out ./drizzle`), `tsr.config.json`, `tsconfig.json` (`@/*` -> `src/*`, `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals`), `vitest.config.ts` (`src/**/*.test.ts`, node env), `vercel.json`, `eslint.config.js`, `prettier.config.js`.

## Architecture rules

- **Routing:** file di `src/routes/` = route. `src/routeTree.gen.ts` generated. Guard tunggal: `requireAuth()` dari `src/lib/auth.ts` yang mengembalikan `{ user }` untuk router context; sesi tidak valid -> redirect `/pin`. **Tidak ada `requireAdmin`.** Semua pengguna dengan sesi valid setara; tabel `users` adalah daftar kader/petugas pencatat, bukan tabel akun — kolom `role` dan `pinHash` sudah dihapus dari skema (`drizzle/manual/20261008_users-buang-role-dan-pinhash.sql`). Alasan lengkap ada di `src/lib/auth.ts` dan `src/lib/user-registry.server.ts`.
- **Backend:** tidak ada `server.handlers` API route. Semua backend = `createServerFn({ method: 'GET' | 'POST' })` di `src/lib/utils.functions.ts` (42 fn) yang mendelegasikan ke file `*.server.ts`. GET = baca, POST = login/mutasi. Fn terproteksi pasang `.middleware([authSessionToken])`. Client tidak pernah mengimpor `db.server.ts` atau `*.server.ts` langsung.
- **DB:** definisi tabel hanya di `src/lib/schema/` (3 file). Import `src/lib/db.server.ts` hanya dari `*.server.ts` dan `scripts/`.
- **Auth:** satu PIN global. `routes/pin.tsx` -> `pinLogin()` -> `isValidPin()` (bandingkan `process.env.PIN`) -> cookie httpOnly (TTL 12 jam) + baris `valid_session` (hash SHA256, sliding idle 1 jam lewat `touchSession`). TTL di `src/lib/constants.ts`. Client baca sesi lewat `useAuth()`, tidak pernah localStorage.
- **Error:** server melempar `Error` biasa dengan pesan string; belum ada error class terpusat. Server-only `console.error` dipakai untuk log, bukan `console.log`.
- **Styling:** token Tailwind v4 di `src/styles.css`. Pakai `cn()` + variant di `src/lib/utils.ts`, jangan hex literal ad-hoc. Mode gelap/terang lewat `src/lib/theme.ts`.
- **Tests:** logika murni, `*.test.ts` di sebelah sumber, 27 file / 440 test. Default `environment: node` dan `include: src/**/*.test.ts`, jadi komponen `.tsx` dan hook React **belum** tersentuh test. Yang butuh koneksi database diuji lewat smoke test terpisah — lihat bagian "Uji terhadap database".

## Generasi domain

Wajib dibaca sebelum mengedit form kunjungan rumah. Ada dua generasi yang berjalan berdampingan dan sengaja begitu.

**Generasi-1 — `src/features/kunjungan-rumah/`.** UI kader. Dipakai route `kunjungan-rumah.tsx` dan `kunjungan-rumah.$id.tsx`. Definisi field-nya dari baris DB lewat `lib/kunjungan-rumah-templates.ts` + `features/kunjungan-rumah/lib/template-from-rows.ts`, dengan bucket layout (`identitas`, `kolom`, `bools`, `baha`) yang disamarkan sebagai prefix `bucket=` pada `form_fields.optionSourceKey`. Parser bucket-nya di `parseBucket()` (`src/lib/utils.server.ts`).

**Generasi-2 — `src/features/survey/`.** Form generik dari Form Builder, dipakai kegiatan Posyandu. `form-runtime.server.ts` menyusun definisi versi form, `DynamicField` merender lima tipe field yang memang bisa ditampilkan UI kader.

**Jembatannya, dan ini yang mudah disalahpahami:** record generasi-1 bukan kode mati. Tabel `kunjungan_rumah_records` menyimpan payload `jsonb`, lalu isi itu dipetakan ke `surveys` (header) + `survey_entries` (satu baris jawaban) memakai field tunggal `record_legacy` pada section `penyimpanan`. Bentuk jsonb sengaja tidak diubah supaya UI yang sudah jalan tidak perlu disentuh. Kolom header yang terisi (`wargaNik`, `petugasId`, `tanggal`) tetap dibaca dari `info`, jadi filter dashboard, sasaran, dan laporan tetap bekerja.

Konsekuensi yang sudah diketahui dan terdokumentasi di `src/lib/utils.server.ts`: rekap per-field ("berapa warga dengan TD tinggi?") belum bisa dijawab, karena butuh `survey_entries` satu baris per field, bukan satu baris berisi seluruh payload.

Kontrak yang mengikat form bawaan ke UI kader dikunci di `src/features/form-builder/lib/kode-bawaan.ts`:

- Nama section dan field **bukan** label bebas — keduanya dibaca form kader. Rename ditolak saat Build.
- Tipe field dibatasi `TIPE_KADER` = `text`, `number`, `date`, `select`, `checkbox` (+ `group` khusus `record_legacy`).
- Field di section sasaran wajib punya bucket layout; field section biasa justru tidak boleh punya `optionSourceKey`.
- `record_legacy` tidak boleh dihapus - seluruh data kunjungan disimpan di sana.
- `pnpm db:check-parity` menjaga agar seeder form default dan parser template lokal tidak berbeda paham soal penamaan field.

Kalau menambah form bawaan baru, tambahkan entri di `ATURAN_BAWAAN` (`kode-bawaan.ts`) alih-alih menambah cabang di dua fungsi terpisah.

## Migrasi database

Tiga kanal, jangan dicampur:

| Lokasi                        | Isi                                                                                                          | Kapan dipakai                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `drizzle/<timestamp>_<nama>/` | Hasil `pnpm db:sql` (`drizzle-kit generate`). 10 direktori, masing-masing `migration.sql` + `snapshot.json`. | Perubahan skema biasa. Edit `src/lib/schema/` dulu, lalu generate, lalu periksa `migration.sql` sebelum dipakai.                                                                                          |
| `drizzle/manual/`             | File `.sql` tulis tangan, berawalan tanggal.                                                                 | Perubahan yang tidak bisa lewat `db:sql`: hapus kolom, ubah unique index, seed referensi, atau saat `drizzle-kit generate` terblokir konflik histori (lihat `20261008_users-buang-role-dan-pinhash.sql`). |
| `drizzle/backup/`             | Dump `pg_dump` pra-perubahan. Tidak di-version-control.                                                      | Ambil sebelum migrasi destruktif. Jangan commit.                                                                                                                                                          |

`drizzle.config.ts` memakai glob `./src/lib/schema/*.ts` karena definisi skemanya sudah terbagi tiga file; comentário di file itu menjelaskan alasannya.

Smoke test yang menyentuh query: `pnpm db:smoke-kunjungan-rumah` dan `pnpm db:smoke-kegiatan`. Jalankan kalau PR mengubah lapisan query.

## Scripts

| Script                          | Isi                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm db:seed`                  | `scripts/seed.ts` - petugas + data warga referensi                                              |
| `pnpm db:seed-uji`              | `scripts/seed-uji-coba.mts` - data uji-coba untuk PLN                                           |
| `pnpm db:check-parity`          | `scripts/check-template-parity.mts` - penjaga konsistensi penamaan field form default vs parser |
| `pnpm db:smoke-kunjungan-rumah` | `scripts/smoke-kunjungan-rumah.mts`                                                             |
| `pnpm db:smoke-kegiatan`        | `scripts/smoke-kegiatan.mts`                                                                    |
| `pnpm db:set-non-warga`         | `scripts/set-warga-bentuk-non-warga.mts`                                                        |
| `pnpm db:push`                  | `drizzle-kit push` - push schema langsung, untuk dev                                            |
| `pnpm db:sql`                   | `drizzle-kit generate` - buat migration SQL                                                     |

Skrip lain di `scripts/`: `seed-form-defaults.ts`, `seed-reference.ts`, `verify-form-builder-constraints.sql`.

### Uji terhadap database

Domain yang butuh koneksi database **tidak** diuji oleh `vitest`. Alasannya teknis: `*.server.ts` mengimpor `src/lib/db.server.ts` yang melempar error saat modul dimuat kalau `DATABASE_URL` kosong, jadi mengimpor file-file itu di test node sudah butuh environment database. Jalur ujinya terpisah:

| Jalan                           | Cakupan                                                                                                                                                                                                       | Kapan jalan                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `pnpm test` (vitest)            | Logika murni: validasi, reducer, selector, tree, katalog enum, pembantu laporan. Tidak ada SQL.                                                                                                               | Setiap commit.                                  |
| `pnpm db:check-parity`          | Struktur form bawaan di database: section tetap ada, field penyimpan data ada, bucket sah, mapper bisa mengubah baris jadi form.                                                                              | Setelah mengubah definisi form.                 |
| `pnpm db:smoke-kunjungan-rumah` | Alur kunjungan rumah ujung ke ujung: simpan record, NIK dan petugas terpetakan ke `surveys`, dibaca balik, dashboard/sasaran mengenali warga dummy, build dan terbitkan versi form, update record versi lama. | Setelah mengubah lapisan query kunjungan rumah. |
| `pnpm db:smoke-kegiatan`        | Alur kegiatan: UUID petugas masuk ke `surveys.petugasId`, opsi petugas ter-resolve dari `users`, kegiatan tanpa warga tidak ikut hitung kunjungan, payload rusak ditolak.                                     | Setelah mengubah lapisan query kegiatan.        |
| `pnpm db:seed-uji`              | Mengisi database uji dengan petugas dan warga contoh.                                                                                                                                                         | Menyiapkan database uji.                        |

Smoke test membuat baris lalu **menghapus sendiri** di akhir, memakai NIK sintetis `90000...`. Kalau ada langkah yang gagal sebelum pembersihan, cari submission sisa dan hapus manual.

### Penjaga database uji

Empat skrip yang menulis ke database memanggil `pastikanDatabaseUji()` dari `src/lib/database-uji.ts`. Fungsi itu menolak `DATABASE_URL` yang namanya tidak mengandung penanda `uji`, `trial`, `test`, `staging`, `dev`, `localhost`, atau `127.0.0.1`.

Dulu definisi itu ada tiga kali terpisah di `smoke-kunjungan-rumah.mts`, `smoke-kegiatan.mts`, dan `seed-uji-coba.mts`. Pengaman data yang butuh tiga salinan akan hilang begitu salah satu diedit dan lupa memperbarui yang lain. Sekarang satu definisi, dan perilakunya tidak berubah: pola pencocokannya masih persis sama.

Dua batas yang diketahui dan belum ditutup: pencocokan berupa substring pada seluruh URL, jadi database produksi bernama `pws_dev_backup` ikut lolos; dan database uji yang namanya tidak mengandung penanda akan ditolak. Keduanya tertulis di `src/lib/database-uji.ts`.

`pnpm db:set-non-warga` ikut memakai penjaga yang sama, sehingga hanya bisa jalan di database uji. Itu bukan keterbatasan yang tidak disengaja: jalur resmi untuk menerapkan perubahan itu ke produksi adalah `drizzle/manual/20261003_form-builder-tanpa-warga-wajib.sql`, yang isinya sama persis dan bisa ditinjau sebelum dieksekusi.

## What to touch for common changes

| Change                                     | Files to touch                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tambah halaman                             | File baru `src/routes/<nama>.tsx` + entri `NAV_ITEMS` di `src/lib/nav.ts` + bungkus `AppShell` (atau sisipkan di bawah pola `sasaran.tsx`). Jalankan `pnpm generate-routes`. Guard: `beforeLoad: requireAuth`.                                                                                                                          |
| Ubah sidebar / bottom nav                  | `src/lib/nav.ts` (label, `Icon`, `shortLabel`) + `components/organisms/Sidebar.tsx` / `BottomNav.tsx` untuk layout.                                                                                                                                                                                                                     |
| Tambah server data fetch                   | 1. Implementasi di file `*.server.ts` yang sesuai, 2. expose lewat `createServerFn` di `src/lib/utils.functions.ts` dengan `method` benar + `.middleware([authSessionToken])`, 3. panggil dari `loader` route atau hook.                                                                                                                |
| Ubah skema DB                              | `src/lib/schema/` (tentukan file mana) -> `pnpm db:sql` -> periksa `migration.sql` -> `pnpm db:push`/migrate. Update `scripts/seed*.ts` bila seed terpengaruh.                                                                                                                                                                          |
| Ubah login / session                       | `src/routes/pin.tsx` (UI) + `isValidPin`/`touchSession` di `src/lib/utils.server.ts` + TTL di `src/lib/constants.ts`. Logika cookie/JWT tetap server-only. Rate limit: `src/lib/pin-attempt.ts`.                                                                                                                                        |
| Field form kunjungan rumah                 | **Jangan hardcode.** Form ini disunting lewat Form Builder di `/kelola`. Bentuknya dipetakan balik ke UI lewat nama section dan prefix `<section>::` pada `form_fields.nama`, jadi kunci di `features/form-builder/lib/kode-bawaan.ts` yang akan menolak draft bermasalah. Render: `features/kunjungan-rumah/components/FieldCell.tsx`. |
| Validasi / progres kunjungan               | `features/kunjungan-rumah/services/validateKunjunganRumah.ts`, `progress.ts`, `conditional.ts`, plus test di sebelahnya. State: `store/kunjunganRumahReducer.ts` + `types.ts`. Submit: `hooks/useKunjunganRumahForm.ts`.                                                                                                                |
| Batas unggah foto                          | `constants.ts` (`MAX_FOTO`, `MAX_FILE_BYTES`) + `features/kunjungan-rumah/lib/fotos.ts` (termasuk `compressDataUrl`) + uploader `src/lib/supabase-storage.ts`.                                                                                                                                                                          |
| Form generik / kegiatan                    | `features/survey/services/form-runtime.server.ts` ( definisi runtime) + `components/DynamicField.tsx` (render) + `routes/kegiatan.tsx` + `hooks/use-kegiatan.ts`.                                                                                                                                                                       |
| Definisi form di Form Builder              | `features/form-builder/services/` - `validasi.ts` (aturan field), `build.server.ts` (tulis versi), `form-version.server.ts` (terbitkan/duplikasi versi), `option-source.server.ts` (opsi dinamis). Warna editor: `features/kelola/components/builder/`.                                                                                 |
| Laporan / rekap                            | `src/routes/laporan.tsx` + `features/laporan/` (komponen cetak surat + `report-filter.ts`) + engine `src/lib/rekap-kunjungan-rumah.ts`. Ekspor CSV: `downloadCsv` di `src/lib/utils.ts`.                                                                                                                                                |
| Dashboard                                  | `src/routes/index.tsx` + `features/dashboard/` (`useKegiatanTrend`, `KegiatanTrendChart`) + query di `utils.server.ts`.                                                                                                                                                                                                                 |
| Daftar / detail sasaran                    | `src/routes/sasaran.index.tsx`, `sasaran.$id.tsx` + query di `utils.server.ts` (`querySasaranListPaged`, `querySasaranByNik`) + `DataTable` / `InfoPanel` / `Timeline`.                                                                                                                                                                 |
| Konstanta (kelurahan, posyandu, prioritas) | `src/lib/constants.ts`.                                                                                                                                                                                                                                                                                                                 |
| Komponen UI reusable                       | `atoms` -> `molecules` -> `organisms` di `src/components/` (satu file per komponen + barrel `index.ts`). Variant/bersama taruh di `src/lib/utils.ts`, bukan inline.                                                                                                                                                                     |
| Tema / warna / font                        | `src/styles.css` (`@theme`) + `src/lib/theme.ts` + `components/ThemeToggle.tsx`.                                                                                                                                                                                                                                                        |
| Test baru                                  | `<same-dir>/<nama>.test.ts`, jalankan `pnpm test`. Target logika murni: `validasi.ts`, `sumber-opsi.ts`, `template-field.ts`, `kode-bawaan.ts`, `kunjunganRumahReducer.ts`, `rekap-kunjungan-rumah.ts`, `progress.ts`, `conditional.ts`, `fotos.ts`. Jangan sentuh DB atau jaringan.                                                    |

## Conventions

- Import: `@/...` untuk `src/`. Barrel untuk `components/atoms|molecules|organisms`.
- Client tidak mengimpor `*.server.ts` atau `db.server.ts` langsung.
- Satu komponen per file, test colocated, gaya Prettier (tanpa semicolon, single quote).
- Nama file hook memakai kebab-case (`use-kader-aktif.ts`). Beberapa feature masih pakai camelCase (`useKunjunganRumahForm.ts`) - sedang dirapikan, ikuti pola yang berlaku di file yang kamu sentuh.
- Komentar dalam bahasa Indonesia, dan menjelaskan **kenapa**, bukan apa.
- Jangan diedit: `src/routeTree.gen.ts`, `drizzle/*/snapshot.json`, isi `.output/`.

## PR checklist

1. `pnpm check` dan `pnpm test` lulus. `pnpm lint` bersih.
2. Skema berubah: migration SQL disertakan, `pnpm db:seed` diverifikasi lokal.
3. Route berubah: `pnpm generate-routes` dijalankan, guard `requireAuth` terpasang.
4. Server fn baru: `method` benar (GET baca / POST mutasi), `.middleware([authSessionToken])` terpasang.
5. Query berubah: smoke test domain terkait dijalankan.
6. Field form bawaan berubah: `pnpm db:check-parity` lulus.
