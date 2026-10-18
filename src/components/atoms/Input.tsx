import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  invalid?: boolean
  /** `sm` untuk grid padat (row panel peserta); bawaan ukuran normal. */
  size?: 'md' | 'sm'
}

const SIZE_CLASS = {
  md: 'px-3 py-2.5 text-[13px]',
  sm: 'px-2.5 py-2 text-xs',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, size = 'md', className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-line bg-surface text-ink outline-none',
        SIZE_CLASS[size],
        'placeholder:text-muted-soft focus:border-accent focus:shadow-[0_0_0_2px_var(--color-accent-light)]',
        invalid && 'border-[var(--color-danger-border)]',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
