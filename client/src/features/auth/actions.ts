import { post } from '../../lib/api'
import { toFormErrors, type FormErrors } from '../../lib/formErrors'
import type { Session } from './session'

export interface AuthFormState extends FormErrors {
  values: Record<string, string>
  session?: Session
}

export const emptyAuthState: AuthFormState = { fieldErrors: {}, values: {} }

const text = (form: FormData, key: string) => String(form.get(key) ?? '')

async function submit(path: string, body: object, values: Record<string, string>): Promise<AuthFormState> {
  try {
    const session = await post<Session>(path, body)
    return { fieldErrors: {}, values, session }
  } catch (err) {
    return { ...toFormErrors(err), values }
  }
}

export async function signIn(form: FormData): Promise<AuthFormState> {
  const values = { email: text(form, 'email') }
  const idToken = text(form, 'idToken')
  if (idToken) return submit('/auth/google', { idToken }, values)
  return submit('/auth/login', { ...values, password: text(form, 'password') }, values)
}

export async function signUp(form: FormData): Promise<AuthFormState> {
  const values = { orgName: text(form, 'orgName'), name: text(form, 'name'), email: text(form, 'email') }
  const idToken = text(form, 'idToken')
  if (idToken) {
    if (!values.orgName.trim()) {
      return { fieldErrors: { orgName: 'Enter your organization name first.' }, values }
    }
    return submit('/auth/google', { idToken, orgName: values.orgName }, values)
  }
  return submit('/auth/signup', { ...values, password: text(form, 'password') }, values)
}
