import { MoonIcon, SunIcon, SunMoon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyThemeMode, readThemeMode } from '@/lib/theme'
import type { ThemeMode } from '@/lib/theme'

export default function ThemeToggle({ plain = false }: { plain?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>('auto')

  useEffect(() => {
    const initialMode = readThemeMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [mode])

  function toggleMode() {
    const nextMode: ThemeMode =
      mode === 'light' ? 'dark' : mode === 'dark' ? 'auto' : 'light'
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  const label =
    mode === 'auto'
      ? 'Theme mode: auto (system). Click to switch to light mode.'
      : `Theme mode: ${mode}. Click to switch mode.`

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className={
        plain
          ? 'text-[13px] m-1 font-medium text-ink hover:bg-surface-2 transition cursor-pointer'
          : 'rounded-full border border-chip-line/20 bg-chip-bg px-3 py-1.5 text-sm font-semibold text-sea-ink transition hover:-translate-y-0.5'
      }
    >
      {mode === 'auto' ? <SunMoon size={16} /> : mode === 'dark' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
    </button>
  )
}