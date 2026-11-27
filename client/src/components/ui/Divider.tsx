export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-fg-subtle">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
