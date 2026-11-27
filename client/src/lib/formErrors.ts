import { ApiError } from './api'

export interface FormErrors {
  formError?: string
  fieldErrors: Record<string, string>
}

const FIELD_BY_CODE: Record<string, string> = {
  EMAIL_TAKEN: 'email',
  INVALID_CREDENTIALS: 'password',
}

interface ZodIssue {
  path?: unknown[]
  message: string
}

export function toFormErrors(err: unknown): FormErrors {
  if (!(err instanceof ApiError)) {
    return { formError: "Can't reach the server. Check your connection and try again.", fieldErrors: {} }
  }

  const field = FIELD_BY_CODE[err.code]
  if (field) return { fieldErrors: { [field]: err.message } }

  if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of err.details as ZodIssue[]) {
      const key = issue.path?.[0]
      if (typeof key === 'string') fieldErrors[key] ??= issue.message
    }
    if (Object.keys(fieldErrors).length) return { fieldErrors }
  }

  return { formError: err.message, fieldErrors: {} }
}
