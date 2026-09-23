interface ImportMetaEnv {
  // API Configuration
  readonly VITE_DATABASE_URL: string
  readonly VITE_PIN: number
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}