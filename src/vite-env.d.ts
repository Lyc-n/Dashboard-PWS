interface ImportMetaEnv {
  // API Configuration
  readonly VITE_DATABASE_URL: string
  readonly VITE_PIN: number
  readonly VITE_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}