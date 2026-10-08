import { Button } from '@/components/atoms/Button'
import { Toolbar } from '@/components/molecules/Toolbar'

interface Props {
  onReset: () => void
  onSubmit: () => void
  disabled?: boolean
}

export function SaveBar({ onReset, onSubmit, disabled }: Props) {
  return (
    <Toolbar className="w-full">
      <span className="ml-auto text-xs text-muted">Simpan ke database.</span>
      <Button variant="default" onClick={onReset} disabled={disabled}>
        Reset
      </Button>
      <Button variant="primary" onClick={onSubmit} disabled={disabled}>
        Simpan kunjungan rumah
      </Button>
    </Toolbar>
  )
}
