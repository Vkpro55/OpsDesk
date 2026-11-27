import { useId, type ComponentProps } from 'react'
import { cn } from '../../lib/cn'

type Props = ComponentProps<'input'> & {
  label: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, id, className, ...props }: Props) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const noteId = `${inputId}-note`
  const note = error ?? hint

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-label font-medium">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={cn(
          'h-10 rounded-md border bg-surface px-3 text-base text-fg',
          error ? 'border-danger' : 'border-border-input',
          className,
        )}
        {...props}
      />
      {note && (
        <p id={noteId} className={cn('text-xs', error ? 'text-danger-fg' : 'text-fg-subtle')}>
          {note}
        </p>
      )}
    </div>
  )
}
