/*
 * Kelas-kelas varian/ukuran Button kini hidup di `src/lib/utils.ts`
 * (`buttonClass` dan kawan-kawan) — tempat bersama untuk varian UI, sebagaimana
 * `PILL_STYLES`. Yang dipakai di sini hanya perlu perakitan `<button>`-nya,
 * dan `ButtonLink` bisa merakit tampilan yang sama tanpa duplikasi kelas.
 */
import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import type { ButtonVariant, ButtonSize } from '@/lib/utils'
import { buttonClass, cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'default', size = 'md', type = 'button', className, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border font-bold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        buttonClass(variant, size),
        className,
      )}
      {...props}
    />
  ),
)

Button.displayName = 'Button'
