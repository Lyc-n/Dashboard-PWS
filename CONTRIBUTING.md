# Contributing ke Dashboard-PWS

Stack: TanStack Start (React 19, Nitro, Vite 8), TanStack Router (file route), Drizzle ORM (Postgres), Tailwind CSS v4, dan Vitest.

## Quick start

```bash
pnpm install
pnpm dev               # vite dev --port 3000
pnpm test              # vitest run
pnpm lint              # eslint
pnpm format            # prettier --write . && eslint --fix
pnpm check             # tsc --noEmit && prettier --check .  (jalankan sebelum commit)
pnpm generate-routes   # tsr generate -> src/routeTree.gen.ts
pnpm build
```

Env yang dipakai: `DATABASE_URL` (hanya server), `SECRET_KEY` (base64, untuk JWT lewat `jose`), dan `PIN` (PIN login). Variabel berawalan `VITE_` ikut masuk bundle browser. Daftar prefix ada di `envPrefix` pada `vite.config.ts`. Saat setup, salin `.env.example` ke `.env`.

Sebelum mengubah banyak file, ikuti blok di `AGENTS.md`: jalankan `npx @tanstack/intent@latest list`, lalu load skill yang cocok.

## Cari file dari tugasnya

Folder di `src/` dibagi per lapisan (komponen, hook, logika, server). Di dalam tiap lapisan, kode dikelompokkan per fitur. Jadi untuk mengubah fitur `survey`, cari `survey` di setiap lapisan yang relevan.

```
src/
  routes/                    Halaman. Satu file = satu URL. Setiap route dijaga requireAuth.
  components/
    ui/                      Komponen UI generik (tombol, input, kartu, badge), lewat barrel index.ts.
                             Overlay, toggle tema, dan loading route diimpor langsung dari filenya.
    layout/                  Kerangka aplikasi: AppShell, Sidebar, Topbar, BottomNav.
    shared/                  Komponen gabungan lintas fitur: DataTable, Timeline, panel, dan lainnya.
    <fitur>/                 Komponen khusus satu fitur.
  hooks/
    *.ts                     Hook generik lintas fitur (async, local storage, media query, overlay).
    <fitur>/                 Hook khusus satu fitur.
  lib/
    <fitur>/                 Logika murni khusus satu fitur: tipe, parser, helper, store/.
    service/<fitur>/         Aturan domain murni yang dipakai validasi dan form.
    server/                  Query DB lintas fitur (kunjungan, sasaran, submit) dan db.server.ts.
    server/<fitur>/          Query dan mutasi DB khusus satu fitur (*.server.ts).
    api/server-fns.ts        Satu-satunya jalur dari client ke server.
    auth/                    Login PIN, sesi, rate limit, dan requireAuth.
    schema/                  Skema Drizzle. Sumber kebenaran tabel.
    nav/                     Menu sidebar dan cache daftar form.
    uji/                     Pengaman dan helper skrip yang menulis ke database uji.
    utils.ts, constants.ts, theme.ts, enum-values.ts, supabase-storage.ts
  providers/                 AuthProvider dan ToastProvider.
  assets/                    Gambar brand.
  router.tsx, styles.css     Konfigurasi router dan token Tailwind.
  routeTree.gen.ts           Dibuat otomatis. Jangan diedit.
drizzle/                     Migrasi database. Lihat "Migrasi database".
scripts/                     Seed, smoke test, dan cek paritas. Lihat "Scripts".
```

Fitur yang ada: `survey`, `kunjungan-rumah`, `form-builder`, `kelola`, `petugas`, `laporan`, dan `dashboard`.

### Isi tiap lapisan

| Folder                 | Isi                                                     | Boleh mengimpor                                      |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `components/<fitur>/`  | Komponen React                                          | `lib/`, `hooks/`, barrel `ui/`, `layout/`, `shared/` |
| `hooks/<fitur>/`       | Hook React                                              | `lib/`, `src/lib/api/server-fns.ts`                  |
| `lib/<fitur>/`         | Logika murni: tipe, parser, helper, reducer di `store/` | Apa saja, kecuali database dan React                 |
| `lib/service/<fitur>/` | Aturan domain murni: validasi, progres, kondisi tampil  | `lib/`                                               |
| `lib/server/<fitur>/`  | `*.server.ts`: query dan mutasi database                | `lib/server/db.server.ts`, `lib/schema/`, `lib/`     |

Dua aturan tambahan:

- Folder `lib/server/` hanya berisi file `*.server.ts`. Client tidak mengimpor nilai dari sana. Impor `type` tetap boleh, karena tidak masuk bundle.
- Kalau sebuah subfolder mulai penuh, buat subfolder per topik. Contohnya `lib/kunjungan-rumah/sasaran/`, `lib/kunjungan-rumah/template/`, dan `lib/service/kunjungan-rumah/`.

### Menaruh kode baru

1. Komponen yang khusus satu fitur masuk ke `src/components/<fitur>/`. Komponen generik masuk ke `ui/` (kecil, tanpa logika domain), `layout/` (kerangka halaman), atau `shared/` (gabungan yang dipakai beberapa fitur).
2. Hook khusus satu fitur masuk ke `src/hooks/<fitur>/`. Hook generik masuk ke `src/hooks/`.
3. Logika murni khusus satu fitur masuk ke `src/lib/<fitur>/`. Aturan validasi atau progres masuk ke `src/lib/service/<fitur>/`.
4. Query DB khusus satu fitur masuk ke `src/lib/server/<fitur>/`. Query DB yang dipakai banyak fitur masuk ke `src/lib/server/`.
5. Kode yang dipakai dua fitur atau lebih naik ke tingkat atas: `components/`, `hooks/`, `lib/`, atau `lib/server/`. Jangan taruh di salah satu fitur.

## Aturan arsitektur

- **Routing.** File di `src/routes/` adalah route. `src/routeTree.gen.ts` dibuat otomatis. Guard tunggalnya `requireAuth()` dari `src/lib/auth/auth.ts`, yang mengembalikan `{ user }` untuk router context. Sesi tidak valid berarti redirect ke `/pin`. **Tidak ada `requireAdmin`.** Semua pengguna dengan sesi valid setara. Tabel `users` berisi daftar kader atau petugas pencatat, bukan tabel akun. Kolom `role` dan `pinHash` sudah dihapus dari skema, dengan migrasi di `drizzle/manual/20261008_users-buang-role-dan-pinhash.sql`. Alasan lengkapnya ada di `src/lib/auth/auth.ts` dan `src/lib/server/petugas/user-registry.server.ts`.
- **Backend.** Tidak ada `server.handlers` atau API route. Semua backend berupa `createServerFn({ method: 'GET' | 'POST' })` di `src/lib/api/server-fns.ts`, yang mendelegasikan ke file `*.server.ts`. GET dipakai untuk membaca, dan POST untuk login dan mutasi. Fn yang butuh sesi memasang `.middleware([authSessionToken])`. Client tidak mengimpor `db.server.ts` atau `*.server.ts` untuk nilai runtime.
- **DB.** Definisi tabel hanya ada di `src/lib/schema/` (tiga file). Import `src/lib/server/db.server.ts` hanya dari file `*.server.ts` dan dari `scripts/`.
- **Auth.** Satu PIN global. `routes/pin.tsx` memanggil `pinLogin()` di `server-fns.ts`, yang memanggil `isValidPin()` di `src/lib/auth/session.server.ts`. Isi PIN dibandingkan dengan `process.env.PIN`. Login berhasil menghasilkan cookie httpOnly dengan TTL 12 jam, dan satu baris `valid_session` berisi hash SHA256. Sesi idle 1 jam dan dikelola lewat `touchSession`. TTL ada di `src/lib/constants.ts`. Client membaca sesi lewat `useAuth()`. Client tidak pernah membaca dari localStorage.
- **Error.** Server melempar `Error` biasa dengan pesan string. Belum ada kelas error terpusat. Untuk log di server, pakai `console.error`, bukan `console.log`.
- **Styling.** Token Tailwind v4 ada di `src/styles.css`. Pakai `cn()` dan variant dari `src/lib/utils.ts`. Jangan tulis hex literal ad hoc. Mode gelap dan terang diatur lewat `src/lib/theme.ts`.
- **Tes.** Logika murni, `*.test.ts` di folder yang sama dengan sumbernya. `vitest.config.ts` hanya memuat `src/**/*.test.ts` dengan environment `node`. Komponen `.tsx` dan hook React belum punya test. Domain yang butuh database diuji lewat smoke test terpisah (lihat "Uji terhadap database").

## Generasi domain

Baca bagian ini sebelum mengubah form kunjungan rumah. Dua generasi berjalan berdampingan, dan itu disengaja.

**Generasi-1: `kunjungan-rumah`.** Ini UI kader. Dipakai route `kunjungan-rumah.tsx` dan `kunjungan-rumah.$id.tsx`. Komponennya ada di `src/components/kunjungan-rumah/`. Definisi field dibaca dari baris DB lewat `src/lib/kunjungan-rumah/template/kunjungan-rumah-templates.ts` dan `template-from-rows.ts`. Bucket layout disimpan sebagai prefix `bucket=` pada `form_fields.optionSourceKey`. Empat bucket-nya adalah `identitas`, `kolom`, `bools`, dan `baha`. Parser bucket ada di `parseBucket()` di `src/lib/server/kunjungan-rumah.server.ts`.

**Generasi-2: `survey`.** Form generik dari Form Builder, dipakai kegiatan Posyandu. `src/lib/server/survey/form-runtime.server.ts` menyusun definisi versi form. `src/components/survey/DynamicField.tsx` merender lima tipe field yang bisa ditampilkan UI kader.

**Hubungan keduanya.** Record generasi-1 bukan kode mati. Tabel `kunjungan_rumah_records` menyimpan payload `jsonb`. Payload itu dipetakan ke `surveys` (header) dan `survey_entries` (satu baris per jawaban). Pemetaannya memakai field tunggal `record_legacy` di section `penyimpanan`. Bentuk jsonb sengaja tidak diubah, supaya UI yang sudah jalan tidak perlu disentuh. Kolom header (`wargaNik`, `petugasId`, `tanggal`) tetap dibaca dari `info`, sehingga filter dashboard, sasaran, dan laporan tetap bekerja.

Keterbatasan yang sudah diketahui dan didokumentasikan di `src/lib/server/kunjungan-rumah.server.ts`: rekap per field, misalnya berapa warga dengan TD tinggi, belum bisa dijawab. Rekap seperti itu butuh `survey_entries` dengan satu baris per field, bukan satu baris berisi seluruh payload.

Aturan yang mengunci form bawaan ke UI kader ada di `src/lib/form-builder/kode-bawaan.ts`:

- Nama section dan field tidak bebas. Form kader membacanya, dan rename ditolak saat Build.
- Tipe field dibatasi `TIPE_KADER`: `text`, `number`, `date`, `select`, `checkbox`, plus `group` khusus `record_legacy`.
- Field di section sasaran wajib punya bucket layout. Field di section biasa tidak boleh punya `optionSourceKey`.
- `record_legacy` tidak boleh dihapus. Seluruh data kunjungan disimpan di sana.
- `pnpm db:check-parity` menjaga seeder form bawaan dan parser template lokal tetap sepakat soal nama field.

Untuk menambah form bawaan baru, tambahkan entri di `ATURAN_BAWAAN` (`kode-bawaan.ts`). Jangan menambah cabang di dua fungsi terpisah.

## Migrasi database

Ada tiga kanal. Jangan dicampur.

| Lokasi                        | Isi                                                                                                      | Kapan dipakai                                                                                                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `drizzle/<timestamp>_<nama>/` | Hasil `pnpm db:sql` (`drizzle-kit generate`). Tiap direktori berisi `migration.sql` dan `snapshot.json`. | Perubahan skema biasa. Edit `src/lib/schema/` dulu, lalu generate, lalu periksa `migration.sql` sebelum dipakai.                                                                                             |
| `drizzle/manual/`             | File `.sql` tulisan tangan, diawali tanggal.                                                             | Perubahan yang tidak bisa lewat `db:sql`: hapus kolom, ubah unique index, seed referensi, atau saat `drizzle-kit generate` terblokir konflik histori. Contohnya `20261008_users-buang-role-dan-pinhash.sql`. |
| `drizzle/backup/`             | Dump `pg_dump` sebelum perubahan. Tidak di-version-control.                                              | Ambil sebelum migrasi destruktif. Jangan di-commit.                                                                                                                                                          |

`drizzle.config.ts` memakai glob `./src/lib/schema/*.ts` karena definisi skema sudah terbagi tiga file. Komentar di file itu menjelaskan alasannya.

Jalankan `pnpm db:smoke-kunjungan-rumah` dan `pnpm db:smoke-kegiatan` kalau PR mengubah lapisan query.

## Scripts

| Script                          | File                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm db:seed`                  | `scripts/seed.ts`: petugas dan data warga referensi                                              |
| `pnpm db:seed-uji`              | `scripts/seed-uji-coba.mts`: data uji coba untuk PLN                                             |
| `pnpm db:check-parity`          | `scripts/check-template-parity.mts`: menjaga penamaan field form bawaan tetap sama dengan parser |
| `pnpm db:smoke-kunjungan-rumah` | `scripts/smoke-kunjungan-rumah.mts`                                                              |
| `pnpm db:smoke-kegiatan`        | `scripts/smoke-kegiatan.mts`                                                                     |
| `pnpm db:set-non-warga`         | `scripts/set-warga-bentuk-non-warga.mts`                                                         |
| `pnpm db:push`                  | `drizzle-kit push`: dorong skema langsung, untuk dev                                             |
| `pnpm db:sql`                   | `drizzle-kit generate`: buat migration SQL                                                       |

Skrip lain di `scripts/`: `seed-form-defaults.ts`, `seed-reference.ts`, dan `verify-form-builder-constraints.sql`.

### Uji terhadap database

Domain yang butuh database tidak diuji oleh `vitest`, karena `*.server.ts` mengimpor `src/lib/server/db.server.ts`. Modul itu melempar error saat dimuat jika `DATABASE_URL` kosong. Akibatnya, test node yang mengimpor file-file itu sudah butuh environment database. Jalur uji untuk domain ini terpisah:

| Jalan                           | Cakupan                                                                                                                                                                                                                | Kapan jalan                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `pnpm test` (vitest)            | Logika pure: validasi, reducer, selector, tree, katalog enum, pembantu laporan. Tidak ada SQL.                                                                                                                         | Setiap commit.                                  |
| `pnpm db:check-parity`          | Struktur form bawaan di database: section tetap ada, field penyimpan data ada, bucket sah, mapper bisa mengubah baris jadi form.                                                                                       | Setelah mengubah definisi form.                 |
| `pnpm db:smoke-kunjungan-rumah` | Alur kunjungan rumah dari ujung ke ujung: simpan record, NIK dan petugas terpetakan ke `surveys`, dibaca balik, dashboard dan sasaran mengenali warga dummy, build dan terbitkan versi form, update record versi lama. | Setelah mengubah lapisan query kunjungan rumah. |
| `pnpm db:smoke-kegiatan`        | Alur kegiatan: UUID petugas masuk ke `surveys.petugasId`, opsi petugas di-resolve dari `users`, kegiatan tanpa warga tidak ikut menghitung kunjungan, payload rusak ditolak.                                           | Setelah mengubah lapisan query kegiatan.        |
| `pnpm db:seed-uji`              | Mengisi database uji dengan petugas dan warga contoh.                                                                                                                                                                  | Menyiapkan database uji.                        |

Smoke test membuat baris lalu menghapusnya sendiri di akhir. Mereka memakai NIK sintetis `90000...`. Kalau ada langkah yang gagal sebelum pembersihan, cari submission sisa dan hapus manual.

### Penjaga database uji

Empat skrip yang menulis ke database memanggil `pastikanDatabaseUji()` dari `src/lib/uji/database-uji.ts`. Fungsi itu menolak `DATABASE_URL` yang namanya tidak mengandung penanda `uji`, `trial`, `test`, `staging`, `dev`, `localhost`, atau `127.0.0.1`.

Dulu ada tiga salinan definisinya, di `smoke-kunjungan-rumah.mts`, `smoke-kegiatan.mts`, dan `seed-uji-coba.mts`. Tiga salinan mudah tidak sinkron: satu diubah, yang lain terlewat. Sekarang hanya ada satu definisi. Perilakunya sama, termasuk pola pencocokannya.

Dua batas yang sudah diketahui dan belum ditutup:

- Pencocokan berupa substring pada seluruh URL. Karena itu database produksi `pws_dev_backup` lolos, sebab namanya mengandung `dev`.
- Database uji yang namanya tidak memuat penanda akan ditolak.

Keduanya dicatat di `src/lib/uji/database-uji.ts`.

`pnpm db:set-non-warga` memakai penjaga yang sama, jadi hanya bisa jalan di database uji, dan itu disengaja. Jalur resmi untuk menerapkan perubahan itu ke produksi adalah `drizzle/manual/20261003_form-builder-tanpa-warga-wajib.sql`. File itu berisi perubahan yang sama dan bisa ditinjau sebelum dijalankan.

## Mau mengubah apa

| Perubahan                                  | File yang disentuh                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tambah halaman                             | File baru `src/routes/<nama>.tsx`, entri di `NAV_ITEMS` (`src/lib/nav/nav.ts`), dan bungkus `AppShell` (atau ikuti pola `sasaran.tsx`). Jalankan `pnpm generate-routes`. Guard: `beforeLoad: requireAuth`.                                                                                                            |
| Ubah sidebar atau bottom nav               | `src/lib/nav/nav.ts` (label, `Icon`, `shortLabel`) dan `src/components/layout/Sidebar.tsx` atau `BottomNav.tsx` untuk layout.                                                                                                                                                                                         |
| Tambah pengambilan data dari server        | 1. Query di `src/lib/server/*.server.ts` (dipakai lintas fitur) atau `src/lib/server/<fitur>/*.server.ts` (satu fitur). 2. Expose lewat `createServerFn` di `src/lib/api/server-fns.ts` dengan `method` yang benar dan `.middleware([authSessionToken])`. 3. Panggil dari `loader` route atau hook.                   |
| Ubah skema DB                              | `src/lib/schema/` (pilih file yang tepat), lalu `pnpm db:sql`, periksa `migration.sql`, lalu `pnpm db:push` atau migrate. Perbarui `scripts/seed*.ts` kalau seed terdampak.                                                                                                                                           |
| Ubah login atau sesi                       | `src/routes/pin.tsx` (UI), `isValidPin` dan `touchSession` di `src/lib/auth/session.server.ts`, TTL di `src/lib/constants.ts`. Rate limit: `src/lib/auth/pin-attempt.ts`.                                                                                                                                             |
| Field form kunjungan rumah                 | **Jangan hardcode.** Form ini disunting lewat Form Builder di `/kelola`. Kunci nama section dan field ada di `src/lib/form-builder/kode-bawaan.ts`, yang menolak draft bermasalah. Render: `src/components/kunjungan-rumah/FieldCell.tsx`.                                                                            |
| Validasi dan progres kunjungan             | `src/lib/service/kunjungan-rumah/` (`validate-kunjungan-rumah.ts`, `progress.ts`, `conditional.ts`) beserta test di sebelahnya. State: `src/lib/kunjungan-rumah/store/kunjungan-rumah-reducer.ts` dan `src/lib/kunjungan-rumah/types.ts`. Submit: `src/hooks/kunjungan-rumah/use-kunjungan-rumah-form.ts`.            |
| Batas unggah foto                          | `src/lib/constants.ts` (`MAX_FOTO`, `MAX_FILE_BYTES`), `src/lib/kunjungan-rumah/fotos.ts` (termasuk `compressDataUrl`), dan uploader `src/lib/supabase-storage.ts`.                                                                                                                                                   |
| Form generik dan kegiatan                  | `src/lib/server/survey/form-runtime.server.ts` (definisi runtime), `src/components/survey/DynamicField.tsx` (render), `src/routes/kegiatan.tsx`, dan `src/hooks/survey/use-kegiatan.ts`.                                                                                                                              |
| Definisi form di Form Builder              | Aturan murni di `src/lib/service/form-builder/` (`validasi.ts`, `sumber-opsi.ts`). Query dan mutasi di `src/lib/server/form-builder/`: `build.server.ts` (tulis versi), `form-version.server.ts` (terbitkan dan duplikasi versi), `option-source.server.ts` (opsi dinamis). Editor: `src/components/kelola/builder/`. |
| Laporan dan rekap                          | `src/routes/laporan.tsx`, `src/components/laporan/` (cetak surat, riwayat), dan `src/lib/laporan/` (`report-filter.ts`, `rekap-kunjungan-rumah.ts`). Ekspor CSV: `downloadCsv` di `src/lib/utils.ts`.                                                                                                                 |
| Dashboard                                  | `src/routes/index.tsx`, `src/components/dashboard/KegiatanTrendChart.tsx`, `src/hooks/dashboard/use-kegiatan-trend.ts`, dan query yang dipanggil hook lewat `src/lib/api/server-fns.ts`.                                                                                                                              |
| Daftar dan detail sasaran                  | `src/routes/sasaran.index.tsx`, `sasaran.$id.tsx`, query di `src/lib/server/sasaran.server.ts` (`querySasaranListPaged`, `querySasaranByNik`), dan komponen `DataTable`, `InfoPanel`, `Timeline`.                                                                                                                     |
| Data kader dan petugas                     | `src/lib/server/petugas/user-registry.server.ts` (query DB), `src/lib/petugas/user-registry.ts` (tipe yang aman dibaca client), `src/lib/petugas/staff.ts`, dan `src/hooks/petugas/`.                                                                                                                                 |
| Konstanta (kelurahan, posyandu, prioritas) | `src/lib/constants.ts`.                                                                                                                                                                                                                                                                                               |
| Komponen UI yang bisa dipakai ulang        | Di `src/components/ui/` (satu file per komponen, lewat barrel `index.ts`). Kerangka halaman di `layout/`, dan komponen gabungan di `shared/`. Variant dan helper bersama taruh di `src/lib/utils.ts`, bukan inline.                                                                                                   |
| Tema, warna, font                          | `src/styles.css` (`@theme`), `src/lib/theme.ts`, dan `src/components/ui/ThemeToggle.tsx`.                                                                                                                                                                                                                             |
| Test baru                                  | `<folder-yang-sama>/<nama>.test.ts`, lalu jalankan `pnpm test`. Target logika pure: `validasi.ts`, `sumber-opsi.ts`, `template-field.ts`, `kode-bawaan.ts`, `kunjungan-rumah-reducer.ts`, `rekap-kunjungan-rumah.ts`, `progress.ts`, `conditional.ts`, `fotos.ts`. Jangan sentuh DB atau jaringan.                    |

## Konvensi

- Import memakai `@/...` untuk `src/`. Barrel dipakai untuk `components/ui`, `components/layout`, dan `components/shared`.
- Client tidak mengimpor nilai dari `*.server.ts` atau `db.server.ts`.
- Satu komponen per file. Test ditaruh di folder yang sama. Format mengikuti Prettier (tanpa semicolon, single quote).
- Komponen React memakai PascalCase, misalnya `KunjunganRumahFormScene.tsx`. Hook dan modul non-komponen memakai kebab-case, misalnya `use-kader-aktif.ts` dan `kunjungan-rumah-reducer.ts`.
- Komentar ditulis dalam bahasa Indonesia dan menjelaskan kenapa, bukan apa.
- Jangan diedit: `src/routeTree.gen.ts`, `drizzle/*/snapshot.json`, dan isi `.output/`.

## PR checklist

1. `pnpm check` dan `pnpm test` lulus. `pnpm lint` bersih.
2. Skema berubah: migration SQL ikut di PR, dan `pnpm db:seed` sudah diuji lokal.
3. Route berubah: `pnpm generate-routes` sudah dijalankan dan guard `requireAuth` terpasang.
4. Server fn baru: `method` benar (GET untuk baca, POST untuk mutasi) dan `.middleware([authSessionToken])` terpasang.
5. Query berubah: smoke test domain terkait sudah dijalankan.
6. Field form bawaan berubah: `pnpm db:check-parity` lulus.
