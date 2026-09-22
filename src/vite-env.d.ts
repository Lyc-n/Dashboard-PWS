interface ImportMetaEnv {
  // API Configuration
  readonly VITE_DATABASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}