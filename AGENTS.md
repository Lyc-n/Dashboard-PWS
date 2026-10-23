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

**Baca `CONTRIBUTING.md` sebelum edit besar.** Isinya peta codebase, aturan arsitektur, tabel "what to touch", dan daftar path yang sudah dihapus. `README.md` untuk setup dan overview route.

## Gate sebelum commit

```bash
pnpm check   # tsc --noEmit && prettier --check .
pnpm test    # vitest run
pnpm lint    # eslint
```

Baseline saat ini: `tsc` exit 0, `eslint` 0 problems, 440 test lulus. Jangan turunkan gate ini tanpa alasan tertulis.

## Aturan yang paling sering dilanggar

- **Route:** file di `src/routes/` = route. Guard tunggal `requireAuth` dari `src/lib/auth.ts`. **Tidak ada `requireAdmin`** — semua sesi valid setara. Setelah tambah/ubah route, jalankan `pnpm generate-routes`; `src/routeTree.gen.ts` tidak boleh diedit manual.
- **Server:** tidak ada API route terpisah. Semua backend = `createServerFn` di `src/lib/utils.functions.ts` (GET baca / POST mutasi, + `.middleware([authSessionToken])`) yang mendelegasikan ke `*.server.ts`. Client tidak pernah mengimpor `db.server.ts` atau `*.server.ts` langsung.
- **DB:** definisi tabel hanya di `src/lib/schema/` (tiga file: `schema.ts`, `data-import.ts`, `type-enum.ts`). Ganti skema di sana, lalu `pnpm db:sql`, lalu periksa `migration.sql` hasil generate.
- **Form bawaan:** field form kunjungan rumah bukan label bebas. Nama section/field, tipe field, dan bucket layout dikunci di `src/features/form-builder/lib/kode-bawaan.ts`. Mengubahnya bisa membuat form kader gagal render. Jalankan `pnpm db:check-parity` kalau menyentuh penamaan field.
- **Dua generasi domain berjalan berdampingan** (`features/kunjungan-rumah/` dan `features/survey/`). Baca bagian "Generasi domain" di `CONTRIBUTING.md` sebelum mengedit form kunjungan rumah. Jangan menganggap salah satunya kode mati.
- **Test:** logika murni, `*.test.ts` colocated, tanpa DB/jaringan. `vitest.config.ts` hanya meng-include `*.test.ts` dengan `environment: node`, sehingga komponen `.tsx` dan hook React belum punya test — jangan tulis test yang butuh DOM tanpa mengubah config itu lebih dulu.
- **Test yang butuh database:** jangan. `*.server.ts` mengimpor `db.server.ts` yang melempar saat modul dimuat tanpa `DATABASE_URL`, jadi mengimpornya di test sudah butuh environment database. Jalurnya smoke test (`pnpm db:smoke-*`) dan `pnpm db:check-parity`; peta cakupan ada di `CONTRIBUTING.md`.
- **Penjaga database uji:** skrip yang menulis ke DB wajib memanggil `pastikanDatabaseUji()` dari `src/lib/database-uji.ts`. Jangan menyalin regex-nya sendiri.

## Gaya

- Import `@/...`. Barrel untuk `components/atoms|molecules|organisms`.
- Prettier: tanpa semicolon, single quote.
- Komentar bahasa Indonesia, menjelaskan **kenapa** bukan apa. Repo ini memakai komentar dokumentatif yang panjang dan itu disengaja — ikuti gaya itu.
- Tailwind: pakai token dari `src/styles.css` dan `cn()` + variant di `src/lib/utils.ts`. Jangan hex literal ad-hoc.
