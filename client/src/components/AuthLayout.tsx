import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Card } from './ui/Card'

interface Props {
  title: string
  subtitle: string
  footer: ReactNode
  wide?: boolean
  children: ReactNode
}

export function AuthLayout({ title, subtitle, footer, wide, children }: Props) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className={cn('flex w-full flex-col gap-6', wide ? 'max-w-[440px]' : 'max-w-[400px]')}>
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-lg font-semibold text-on-primary">
            O
          </span>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-fg-muted">{subtitle}</p>
        </header>
        <Card>{children}</Card>
        <p className="text-center text-sm text-fg-muted">{footer}</p>
      </div>
    </main>
  )
}
