import { afterEach, expect, it, vi } from 'vitest'
import { signIn, signUp } from './actions'

const respond = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })))

const form = (fields: Record<string, string>) => {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.set(k, v)
  return fd
}

afterEach(() => vi.unstubAllGlobals())

it('signIn returns the session on success', async () => {
  const session = { accessToken: 't', user: { id: '1' }, org: { id: '2' } }
  respond(200, session)
  const state = await signIn(form({ email: 'a@x.com', password: 'secret123' }))
  expect(state.session).toEqual(session)
  expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', expect.objectContaining({ method: 'POST' }))
})

it('signUp puts EMAIL_TAKEN under email and never echoes the password', async () => {
  respond(409, { error: { code: 'EMAIL_TAKEN', message: 'This email already has an account.' } })
  const state = await signUp(
    form({ orgName: 'Acme', name: 'Ann', email: 'a@x.com', password: 'secret123' }),
  )
  expect(state.fieldErrors.email).toBe('This email already has an account.')
  expect(state.values).toEqual({ orgName: 'Acme', name: 'Ann', email: 'a@x.com' })
})

it('Google sign-in posts only the ID token', async () => {
  respond(200, { accessToken: 't' })
  await signIn(form({ idToken: 'gid', email: '', password: '' }))
  expect(fetch).toHaveBeenCalledWith(
    '/api/v1/auth/google',
    expect.objectContaining({ body: JSON.stringify({ idToken: 'gid' }) }),
  )
})

it('Google sign-up needs an org name before calling the server', async () => {
  respond(201, {})
  const state = await signUp(form({ idToken: 'gid', orgName: ' ' }))
  expect(state.fieldErrors.orgName).toMatch(/organization name/)
  expect(fetch).not.toHaveBeenCalled()

  await signUp(form({ idToken: 'gid', orgName: 'Acme' }))
  expect(fetch).toHaveBeenCalledWith(
    '/api/v1/auth/google',
    expect.objectContaining({ body: JSON.stringify({ idToken: 'gid', orgName: 'Acme' }) }),
  )
})

it('network failure becomes a form error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  const state = await signIn(form({ email: 'a@x.com', password: 'x' }))
  expect(state.formError).toMatch(/reach the server/)
})
