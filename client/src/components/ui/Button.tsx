import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-canvas',
}

type Props = ComponentProps<'button'> & { variant?: keyof typeof variants }

export function Button({ variant = 'primary', type = 'button', className, ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
