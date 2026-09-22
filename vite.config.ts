import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), nitro(), tailwindcss(), tanstackStart(), viteReact()],
  ssr: {
    // Fix rolldown MISSING_EXPORT for @tanstack/history in nitro build (upstream mismatch)
    // Externalize to avoid bundling issue; Node will resolve at runtime
    external: ["@tanstack/history"],
  },
  envPrefix: 'VITE_'
})

export default config
