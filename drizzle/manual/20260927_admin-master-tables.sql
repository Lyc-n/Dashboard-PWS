-- Master data admin /kelola: prioritas, item pemeriksaan, dan profil staf.
--
-- Non-destructive: hanya membuat tabel baru. Tabel `forms` dan friends tidak disentuh.
-- Tabel `admin_staff` sengaja TIDAK punya kolom password. Login aplikasi memakai PIN
-- tunggal dari env, bukan username/password per staf, jadi tidak ada yang perlu disimpan.
--
-- Catatan penamaan kolom:
--   * "on"            -> `on` keyword SQL reserved (dipakai di JOIN ... ON), wajib di-quote.
--   * "createdAt" /
--     "updatedAt"     -> Postgres melipat identifier tanpa kutip jadi lowercase, sedangkan
--                        drizzle memakai camelCase. Tanpa kutip kolomnya jadi "createdat"
--                        dan query drizzle akan gagal. Sama seperti migration forms.

create table if not exists admin_priorities (
    id         uuid primary key default gen_random_uuid(),
    nama       text not null unique,
    desk       text not null default '',
    warna      text not null default 'tag-default',
    "on"       boolean not null default true,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamptz not null default now()
);

create table if not exists admin_items (
    id         uuid primary key default gen_random_uuid(),
    kode       text not null unique,
    prio       text not null,
    judul      text not null,
    desk       text not null default '',
    "on"       boolean not null default true,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamptz not null default now()
);

create table if not exists admin_staff (
    id         uuid primary key default gen_random_uuid(),
    nama       text not null,
    peran      text not null default 'Kader',
    kel        text not null default '',
    posy       text not null default '',
    hp         text not null default '',
    username   text not null default '',
    "on"       boolean not null default true,
    "createdAt" timestamptz not null default now(),
    "updatedAt" timestamptz not null default now()
);

create index if not exists admin_items_prio_idx on admin_items (prio);
