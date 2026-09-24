interface ImportMetaEnv {
  // Tambah env client (VITE_*) di sini bila perlu.
  // DATABASE_URL / ADMIN_API_TOKEN sengaja tidak pakai VITE_
  // agar tidak terbundel ke client — akses via process.env di server only.
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}