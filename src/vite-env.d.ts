interface ImportMetaEnv {
  // Tambah env client (VITE_*) di sini bila perlu.
  // DATABASE_URL / ADMIN_API_TOKEN sengaja tidak pakai VITE_
  // agar tidak terbundel ke client — akses via process.env di server only.
  // API Configuration
  readonly DATABASE_URL: string
  readonly PIN: number
  readonly SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}