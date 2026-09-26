# Contributing to Dashboard-PWS

Stack: TanStack Start (React 19 + Nitro + Vite 8) + TanStack Router (file routes) + Drizzle ORM (Postgres) + Tailwind CSS v4 + Vitest.

## Quick start

```bash
pnpm install
pnpm dev        # vite dev --port 3000
pnpm test       # vitest run
pnpm lint       # eslint
pnpm format     # prettier --write . && eslint --fix
pnpm db:seed    # tsx scripts/seed.ts (needs DATABASE_URL)
pnpm generate-routes  # tsr generate -> src/routeTree.gen.ts
pnpm build
```

Env: `DATABASE_URL` (server-only), `PIN`, `SECRET_KEY` (base64, JWT via `jose`). `VITE_*` prefix = exposed to browser. See `vite.config.ts:19` (`envPrefix`).

Before a substantial edit, per `AGENTS.md`: run `npx @tanstack/intent@latest list`, load matching skill with `npx @tanstack/intent@latest load <package>#<skill>`.

## Codebase map

```
src/
  router.tsx              # getRouter(): createTanStackRouter({ routeTree, scrollRestoration })
  routeTree.gen.ts        # GENERATED - never edit (regen via pnpm generate-routes)
  styles.css              # Tailwind v4 import + @theme tokens, fonts (Fraunces/Manrope)
  routes/                 # File-based routes (all guarded, see below)
    __root.tsx            # HTML shell, THEME_INIT_SCRIPT, AuthProvider + ToastProvider
    index.tsx             # / Dashboard (requireAuth + getDashboardData)
    pin.tsx               # /pin PIN login (redirects to / if already logged in)
    sasaran.tsx           # /sasaran layout (requireAuth + AppShell + Outlet)
    sasaran.index.tsx     # /sasaran/ list (getSasaranList, filter, CSV export)
    sasaran.$id.tsx       # /sasaran/$id detail by NIK (getSasaranDetail)
    checklist.tsx         # /checklist new visit (ChecklistFormScene)
    checklist.$id.tsx     # /checklist/$id edit (getKunjungan loader)
    kegiatan.tsx          # /kegiatan wizard (useKegiatan + useKegiatanRecords)
    laporan.tsx           # /laporan tabs kunjungan/kegiatan/rekap
    kelola.tsx            # /kelola admin-only (requireAdmin)
  lib/
    schema.ts             # SINGLE source of truth for DB tables/enums
    db.server.ts          # Server-only Drizzle client (postgres-js, prepare:false)
    utils.server.ts       # Server-only impl: session/JWT, queries, save/list kunjungan+kegiatan
    utils.functions.ts    # createServerFn boundary (client calls this, never utils.server.ts)
    auth.ts               # AuthUser, isAdminUser(), requireAuth(), requireAdmin()
    constants.ts          # KELS, PRIOS, POSY, JENIS_KEGIATAN, SESSION_IDLE_MS/TTL_MS, etc.
    nav.ts                # NAV_ITEMS + navItemsForUser / bottomNavItemsForUser
    utils.ts              # cn(), Pill/Tag variants, fmtDate, downloadCsv
    theme.ts              # readThemeMode/applyThemeMode/THEME_INIT_SCRIPT
    kr-form.ts            # Static KR sasaran defs (8 SasaranKey)
    kr-templates.ts       # Dynamic KR template engine v17 (editable in /kelola)
    seeds.ts              # Default checklist items, staff, priorities
    staff.ts              # staffUsernameSuggestion(), DEFAULT_STAFF_PASSWORD
    hasil.ts              # hasilKind() classifier
    rekap-kunjungan.ts    # Pure rekap engine (computeRekap, sasaranGroup, mingguKe)
    supabase-storage.ts   # dokumentasi bucket uploader (DB stores URL, not base64)
  providers/
    auth.tsx              # AuthProvider/useAuth (hydrates via getSessionToken())
    toast.tsx             # ToastProvider/useToast()
  hooks/
    use-local-storage.ts      # SSR-safe useLocalStorage
    use-kr-templates.ts       # Persisted KrTemplates + import/export/reset
    use-kunjungan-records.ts  # Postgres-backed kunjungan list (list/save/update/remove)
    use-kegiatan.ts           # Kegiatan form state machine
    use-kegiatan-records.ts   # Postgres-backed kegiatan list
    use-rekap-kunjungan.ts    # Rekap overrides store
  components/             # Atomic design. Import via barrels (atoms/molecules/organisms).
    atoms/                # Avatar, Badge, Button, Checkbox, Chip, EmptyState, Input,
                          # LogoEmblem, Pill, ProgressBar, RadioCard, Select,
                          # StatusBadge, Tab, Tag, Textarea
    molecules/            # Breadcrumb, Card, CardHeader, ChipGroup, DocCard, DropZone,
                          # FillBar, FormField, HistoryRow, PageHeader, Pagination,
                          # ProfileBox, PwsChart, SectionCard, StatCard, Stepper,
                          # TimelineItem, TindakCard, Toolbar
    organisms/            # AppShell, Sidebar, Topbar, BottomNav, DataTable, ChartCard,
                          # KelurahanSection, FilterBar, FilterCard, DetailHeader,
                          # InfoPanel, HistoryPanel, Timeline, PesertaPanel,
                          # DokumentasiPanel, SuccessPanel
    ThemeToggle.tsx       # Light/dark toggle
  features/               # Domain logic (keeps routes thin)
    checklist/            # Home-visit form domain (largest)
      types.ts / models.ts
      store/kunjunganReducer.ts + store/kunjunganSelectors.ts
      services/validateKunjungan.ts + services/progress.ts + services/conditional.ts
      lib/fotos.ts        # MAX_FOTO 6, 2MB/file, 3.5MB total, compressDataUrl
      hooks/useChecklistForm.ts  # Orchestrator (reducer + templates + save/update)
      components/         # ChecklistFormScene, KeluargaInfoSection, AnggotaSection,
                          # SanitasiSection, SasaranListSection, SasaranForm,
                          # MasalahSection, HasilSection, SaveBar, HistorySection, FieldCell
    kelola/
      types.ts
      components/FormKrSection.tsx      # KR template CRUD editor
      components/PrioritasSection.tsx
      components/StaffSection.tsx
      components/AdminModal.tsx
    laporan/
      RekapKunjunganSection.tsx  # Printable weekly rekap table
  assets/brand.png, brandIcon.png
drizzle/                  # Migrations (drizzle-kit generate). Do not hand-edit snapshots.
scripts/seed.ts           # pnpm db:seed: surveyor + 36 data_warga + 1 forms row
```

Config: `vite.config.ts` (tanstackStart + nitro + tailwindcss), `drizzle.config.ts` (`schema ./src/lib/schema.ts`, `out ./drizzle`), `tsr.config.json`, `tsconfig.json` (`@/*` + `#/*` -> `src/*`, `noUnusedLocals`), `vitest.config.ts` (`src/**/*.test.ts`, node env), `vercel.json`, `eslint.config.js`, `prettier.config.js` (no semi, single quotes).

## Architecture rules

- **Routing:** file in `src/routes/` = route. `src/routeTree.gen.ts` is generated. Guards live in `beforeLoad`: `requireAuth()` -> redirect `/pin` (`src/lib/auth.ts:17`), `requireAdmin()` -> `/pin` or `/laporan` (`src/lib/auth.ts:26`). Loaders call server fns, never DB directly.
- **Backend:** no `server.handlers` API routes. All backend = `createServerFn({ method: 'GET'|'POST' })` in `src/lib/utils.functions.ts` delegating to `src/lib/utils.server.ts`. GET = reads, POST = login/mutations. Protected fns go through `authSessionToken` middleware.
- **DB:** edit only `src/lib/schema.ts`, then `drizzle-kit generate` + `migrate`. Import `src/lib/db.server.ts` only from `*.server.ts` / `scripts/seed.ts`. Payload tables (`kunjungan_records`, `kegiatan_records`) store `jsonb`.
- **Auth:** single-PIN flow: `routes/pin.tsx` -> `pinLogin()` -> `isValidPin()` (`utils.server.ts`, 1s delay, `process.env.PIN`) -> httpOnly cookie (12h) + `valid_session` row (SHA256 hash, sliding 1h idle via `touchSession`). Client reads session via `useAuth()` / `getSessionToken()`, never localStorage.
- **Styling:** Tailwind v4 tokens in `src/styles.css` (`@theme`). Use `cn()` + `Pill` variant system (`src/lib/utils.ts`), not ad-hoc hex. Dark/light via `src/lib/theme.ts`.
- **Tests:** pure-logic only (`*.test.ts` next to source, 7 files). Run `pnpm test`.

## What to touch for common changes

| Change | Files to touch |
|---|---|
| Add a new page | New file `src/routes/<name>.tsx` + add entry to `NAV_ITEMS` in `src/lib/nav.ts` + wrap in `AppShell` (or nest under `sasaran.tsx` pattern). Run `pnpm generate-routes`. |
| Change sidebar / bottom nav | `src/lib/nav.ts` (labels, `adminOnly` flag) + `src/components/organisms/Sidebar.tsx` / `BottomNav.tsx` for layout only. |
| Add route guard | `beforeLoad` in the route file: `requireAuth()` or `requireAdmin()` from `src/lib/auth.ts`. |
| Add server data fetch | 1. Impl in `src/lib/utils.server.ts`, 2. expose via `createServerFn` in `src/lib/utils.functions.ts`, 3. call from route `loader` or hook. Never import `db.server.ts` in client code. |
| Change DB schema | `src/lib/schema.ts` only -> `drizzle-kit generate` -> check `drizzle/<date>_<name>/migration.sql` -> update `scripts/seed.ts` if seed data affected. |
| Change login / session | `src/routes/pin.tsx` (UI) + `src/lib/utils.server.ts` (`isValidPin`, `createSessionHelper`, TTLs) + `src/lib/constants.ts` (`SESSION_IDLE_MS`, `TTL_MS`). Cookie/JWT logic stays server-only. |
| Change roles / admin gate | `src/lib/auth.ts` (`isAdminUser`, `requireAdmin`) + `adminOnly` in `src/lib/nav.ts` + `src/routes/kelola.tsx` guard. |
| Dashboard widgets / stats | `src/routes/index.tsx` + query in `src/lib/utils.server.ts` (`queryStats`) + cards in `src/components/organisms/KelurahanSection.tsx`, `StatCard`, `ChartCard`, `PwsChart`. |
| Sasaran list / detail columns | `src/routes/sasaran.index.tsx`, `src/routes/sasaran.$id.tsx` + `queryWargaList` in `utils.server.ts` + `DataTable` / `InfoPanel` / `Timeline` organisms. |
| Checklist (KR) form fields | **Do not hardcode.** Edit templates at runtime in `/kelola` (stored in localStorage via `use-kr-templates.ts`), engine in `src/lib/kr-templates.ts`. Static fallback defs: `src/lib/kr-form.ts`. Renderer: `src/features/checklist/components/FieldCell.tsx` + `SasaranForm.tsx`. |
| Checklist validation / progress | `src/features/checklist/services/validateKunjungan.ts`, `services/progress.ts`, `services/conditional.ts` + tests next to them. State shape: `features/checklist/types.ts`, `models.ts`, `store/kunjunganReducer.ts`. Submit flow: `hooks/useChecklistForm.ts`. |
| Photo upload limits | `src/features/checklist/lib/fotos.ts` (6 files, 2MB/file, 3.5MB total) + `DokumentasiPanel` / `DropZone` / `DocCard` + uploader `src/lib/supabase-storage.ts`. |
| Laporan / rekap logic | `src/routes/laporan.tsx` + `src/features/laporan/RekapKunjunganSection.tsx` + pure engine `src/lib/rekap-kunjungan.ts` (grouping, `mingguKe`, age). CSV: `downloadCsv` in `src/lib/utils.ts`. |
| Kegiatan form | `src/routes/kegiatan.tsx` + `src/hooks/use-kegiatan.ts` (state machine) + `use-kegiatan-records.ts` (persistence) + `PesertaPanel` / `DokumentasiPanel` organisms. |
| Kelola admin tabs | `src/routes/kelola.tsx` + `src/features/kelola/components/FormKrSection.tsx`, `PrioritasSection.tsx`, `StaffSection.tsx`, types in `features/kelola/types.ts`, defaults in `src/lib/seeds.ts`. |
| New reusable UI | atoms -> molecules -> organisms in `src/components/` (one file per component + barrel `index.ts`). Shared variants/colors go in `src/lib/utils.ts`, not inline. |
| Theme / colors / fonts | `src/styles.css` (`@theme` tokens) + `src/lib/theme.ts` + `src/components/ThemeToggle.tsx`. |
| Constants (kelurahan, posyandu, roles) | `src/lib/constants.ts` (`KELS`, `PRIOS`, `POSY`, `JENIS_KEGIATAN`, etc.). |
| Seed data | `src/lib/seeds.ts` (defaults) + `scripts/seed.ts` (DB insert). Run `pnpm db:seed`. |
| New unit test | `<same-dir>/<name>.test.ts`, run `pnpm test`. Keep DB/network out; test pure functions (`rekap-kunjungan`, `kr-templates`, `validateKunjungan`, `progress`, `conditional`, `fotos`, `types`). |

## Conventions

- Imports: `@/...` (or `#/*`) for `src/`. Barrel imports from `components/atoms|molecules|organisms`.
- Client never imports `*.server.ts` or `db.server.ts` directly; go through `utils.functions.ts` server fns.
- One component per file, colocated tests (`*.test.ts`), Prettier style (no semicolons, single quotes).
- Do not edit: `src/routeTree.gen.ts`, `drizzle/*/snapshot.json`, files in `.output/`, `temp/*.html` (design reference only).

## PR checklist

1. `pnpm test` + `pnpm lint` pass.
2. If schema changed: migration SQL included, `pnpm db:seed` verified locally.
3. If route added: `routeTree.gen.ts` regenerated, nav + guard (`requireAuth`/`requireAdmin`) set.
4. If server fn added: correct `method` (GET read / POST mutation), auth middleware applied.
