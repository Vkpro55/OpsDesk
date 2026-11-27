export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md bg-bad-bg px-3 py-2 text-sm text-bad-fg">
      {message}
    </p>
  )
}
