export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'UNKNOWN_ERROR',
      data?.error?.message ?? 'Something went wrong. Please try again.',
      data?.error?.details,
    )
  }
  return data as T
}
