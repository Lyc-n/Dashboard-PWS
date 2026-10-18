import { Button } from '@/components/ui/Button'
import { ModalOverlay } from '@/components/ui/ModalOverlay'

interface Props {
  title: string
  onClose: () => void
  onSave: () => void
  children: React.ReactNode
}

export function AdminModal({ title, onClose, onSave, children }: Props) {
  return (
    <ModalOverlay
      title={title}
      onClose={onClose}
      bodyClassName="mt-3.5 grid gap-3"
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={onSave}>
            Simpan
          </Button>
        </>
      }
    >
      {children}
    </ModalOverlay>
  )
}
