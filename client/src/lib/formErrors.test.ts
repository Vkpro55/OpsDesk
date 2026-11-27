import { expect, it } from 'vitest'
import { ApiError } from './api'
import { toFormErrors } from './formErrors'

it('maps known codes to their field', () => {
  expect(toFormErrors(new ApiError(409, 'EMAIL_TAKEN', 'Taken'))).toEqual({
    fieldErrors: { email: 'Taken' },
  })
})

it('maps zod issues to fields, first message wins', () => {
  const details = [
    { path: ['password'], message: 'Too short' },
    { path: ['password'], message: 'Second' },
    { path: ['email'], message: 'Invalid email' },
  ]
  expect(toFormErrors(new ApiError(400, 'VALIDATION_ERROR', 'Invalid request', details))).toEqual({
    fieldErrors: { password: 'Too short', email: 'Invalid email' },
  })
})

it('falls back to a form error for unmapped codes and network failures', () => {
  expect(toFormErrors(new ApiError(500, 'INTERNAL_ERROR', 'Boom')).formError).toBe('Boom')
  expect(toFormErrors(new TypeError('Failed to fetch')).formError).toMatch(/reach the server/)
})
