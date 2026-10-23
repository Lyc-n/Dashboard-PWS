import { Button } from '@/components/ui/Button'
import { ModalOverlay } from '@/components/ui/ModalOverlay'

interface Props {
  title: string
  message: string
  onClose: () => void
  onConfirm: () => void
  confirmLabel?: string
  variant?: 'primary' | 'danger'
  disabled?: boolean
}

export function ConfirmModal({
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Ya',
  variant = 'primary',
  disabled = false,
}: Props) {
  return (
    <ModalOverlay
      title={title}
      onClose={onClose}
      width="max-w-[400px]"
      bodyClassName="mt-3 text-sm text-ink-2"
      footer={
        <>
          <Button onClick={onClose} disabled={disabled}>
            Batal
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={disabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </ModalOverlay>
  )
}
