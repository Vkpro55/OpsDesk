import { post } from '../../lib/api'
import { toFormErrors, type FormErrors } from '../../lib/formErrors'
import type { Session } from './session'

export interface AuthFormState extends FormErrors {
  values: Record<string, string>
  session?: Session
}

export const emptyAuthState: AuthFormState = { fieldErrors: {}, values: {} }

const text = (form: FormData, key: string) => String(form.get(key) ?? '')

async function submit(path: string, values: Record<string, string>, password: string): Promise<AuthFormState> {
  try {
    const session = await post<Session>(path, { ...values, password })
    return { fieldErrors: {}, values, session }
  } catch (err) {
    return { ...toFormErrors(err), values }
  }
}

export const signIn = (form: FormData) =>
  submit('/auth/login', { email: text(form, 'email') }, text(form, 'password'))

export const signUp = (form: FormData) =>
  submit(
    '/auth/signup',
    { orgName: text(form, 'orgName'), name: text(form, 'name'), email: text(form, 'email') },
    text(form, 'password'),
  )
