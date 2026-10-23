import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '@/styles.css?url'
import { ToastProvider } from '@/providers/toast'
import { AuthProvider } from '@/providers/auth'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import icon from '@/assets/brandIcon.png'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Dashboard PWS — Dinas Kesehatan Kota Pasuruan',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        href: icon,
      },
    ],
  }),
  shellComponent: RootDocument,
  // Tanpa ini, route yang tidak cocok jatuh ke fallback "Not Found" bawaan router.
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-base font-bold text-ink">Halaman tidak ditemukan.</p>
        <p className="mt-1 text-xs text-muted">
          Periksa kembali tautan yang kamu buka.
        </p>
      </div>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
