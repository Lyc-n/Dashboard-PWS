import { notifications } from '@mantine/notifications'
// import type { ReactNode } from 'react'

export function useToast(): (message: string) => void {
  return (message: string) => {
    notifications.show({
      message,
      autoClose: 2200,
      withCloseButton: false,
    })
  }
}
