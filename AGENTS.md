<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `npx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

## Project

Dashboard PWS: pencatatan kunjungan rumah dan kegiatan Posyandu. TanStack Start (React 19 + Nitro + Vite) + TanStack Router file routes + Drizzle/Postgres + Tailwind v4 + Vitest.

**Baca `CONTRIBUTING.md` sebelum edit besar.** Isinya peta codebase, aturan arsitektur, tabel "Mau mengubah apa", dan daftar path yang sudah dihapus. `README.md` untuk setup dan overview route.

## Gate sebelum commit

```bash
pnpm check   # tsc --noEmit && prettier --check .
pnpm test    # vitest run
pnpm lint    # eslint
```

Baseline saat ini: `tsc` exit 0, `eslint` 0 problem, dan 467 dari 470 test lulus. Tiga test di `lib/kunjungan-rumah/fotos.test.ts` dan `lib/kunjungan-rumah/store/kunjungan-rumah-reducer.test.ts` sudah gagal sebelum refactor struktur folder. Dua file test (`lib/uji/uji-db.test.ts`, `lib/service/form-builder/pesan-field-terpakai.test.ts`) gagal dimuat karena mengimpor modul database. Jangan turunkan gate ini tanpa alasan tertulis.

## Aturan yang paling sering dilanggar

- **Route.** File di `src/routes/` adalah route. Guard tunggalnya `requireAuth` dari `src/lib/auth/auth.ts`. **Tidak ada `requireAdmin`.** Semua sesi valid setara. Setelah menambah atau mengubah route, jalankan `pnpm generate-routes`. Jangan edit `src/routeTree.gen.ts` secara manual.
- **Server.** Tidak ada API route terpisah. Semua backend berupa `createServerFn` di `src/lib/api/server-fns.ts` (GET untuk baca, POST untuk mutasi, plus `.middleware([authSessionToken])`) yang mendelegasikan ke `*.server.ts`. Client tidak pernah mengimpor `db.server.ts` atau `*.server.ts` langsung.
- **DB.** Definisi tabel hanya ada di `src/lib/schema/` (tiga file: `schema.ts`, `data-import.ts`, `type-enum.ts`). Ubah skema di sana, lalu jalankan `pnpm db:sql`, lalu periksa `migration.sql` hasil generate.
- **Form bawaan.** Field form kunjungan rumah tidak bebas dinamai. Nama section, nama field, tipe field, dan bucket layout dikunci di `src/lib/form-builder/kode-bawaan.ts`. Mengubahnya bisa membuat form kader gagal render. Jalankan `pnpm db:check-parity` kalau menyentuh penamaan field.
- **Dua generasi domain.** Fitur `kunjungan-rumah` dan `survey` berjalan berdampingan di tiap lapisan `src/`. Baca bagian "Generasi domain" di `CONTRIBUTING.md` sebelum mengedit form kunjungan rumah. Jangan anggap salah satunya kode mati.
- **Test.** Logika murni, `*.test.ts` di folder yang sama dengan sumbernya, tanpa DB atau jaringan. `vitest.config.ts` hanya meng-include `*.test.ts` dengan `environment: node`. Komponen `.tsx` dan hook React belum punya test. Jangan tulis test yang butuh DOM sebelum config itu diubah.
- **Test yang butuh database.** Jangan tulis test untuk kode ini. `*.server.ts` mengimpor `db.server.ts`, yang melempar error saat dimuat tanpa `DATABASE_URL`. Jalur ujinya smoke test (`pnpm db:smoke-*`) dan `pnpm db:check-parity`. Peta cakupannya ada di `CONTRIBUTING.md`.
- **Penjaga database uji.** Skrip yang menulis ke DB wajib memanggil `pastikanDatabaseUji()` dari `src/lib/uji/database-uji.ts`. Jangan salin regex-nya sendiri.

## Gaya

- Import `@/...`. Barrel untuk `components/ui`, `components/layout`, dan `components/shared`.
- Prettier: tanpa semicolon, single quote.
- Komentar bahasa Indonesia, menjelaskan kenapa, bukan apa. Repo ini sengaja memakai komentar dokumentatif yang panjang. Ikuti gaya itu.
- Tailwind: pakai token dari `src/styles.css`, serta `cn()` dan variant di `src/lib/utils.ts`. Jangan tulis hex literal ad hoc.
