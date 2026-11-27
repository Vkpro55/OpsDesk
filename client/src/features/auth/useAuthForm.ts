import { startTransition, useActionState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { emptyAuthState, type AuthFormState } from './actions'
import { useSession } from './session'

export function useAuthForm(submit: (form: FormData) => Promise<AuthFormState>) {
  const { setSession } = useSession()
  const navigate = useNavigate()
  const formRef = useRef<HTMLFormElement>(null)

  const [state, action, pending] = useActionState(async (_prev: AuthFormState, form: FormData) => {
    const result = await submit(form)
    if (result.session) {
      setSession(result.session)
      navigate('/')
    }
    return result
  }, emptyAuthState)

  const onGoogleCredential = (idToken: string) => {
    const form = new FormData(formRef.current ?? undefined)
    form.set('idToken', idToken)
    startTransition(() => action(form))
  }

  return { state, action, pending, formRef, onGoogleCredential }
}
