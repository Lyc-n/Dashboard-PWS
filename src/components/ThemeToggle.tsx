import { MoonIcon, SunIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyThemeMode, readThemeMode } from '@/lib/theme'
import type { ThemeMode } from '@/lib/theme'

export default function ThemeToggle({ plain = false }: { plain?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const initialMode = readThemeMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'light') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('light')

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [mode])

  function toggleMode() {
    const nextMode: ThemeMode =
      mode === 'light' ? 'dark' : 'light'
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  const label =
    mode === 'light'
      ? `Theme mode: ${mode}. Click to switch mode.`
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
          : 'rounded-full border border-chip-line bg-chip-bg p-2 ml-2 text-sm font-semibold text-sea-ink transition hover:scale-103 active:scale-98'
      }
    >
      {mode === 'dark' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
    </button>
  )
}