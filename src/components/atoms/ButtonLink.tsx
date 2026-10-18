/**
 * Tautan TanStack Router yang tampak persis seperti `Button`.
 *
 * Dulu lima tempat (footers SuccessPanel dan error state) menyalin penuh string
 * kelas tombol primary ke `<Link>` — dengan padding yang mengembar antar salinan
 * (`px-[18px] py-[11px]`, `px-4.5 py-2.75`). Semuanya kini merujuk `buttonClass`
 * di sini, jadi tombol tautan ikut rapi saat ukuran/varian Button berubah.
 */
import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { buttonClass, cn } from '@/lib/utils'
import type { ButtonVariant, ButtonSize } from '@/lib/utils'

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function ButtonLink({
  variant = 'default',
  size = 'md',
  className,
  ...link
}: ButtonLinkProps) {
  return (
    <Link
      {...link}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border font-bold transition-colors',
        buttonClass(variant, size),
        className,
      )}
    />
  )
}
