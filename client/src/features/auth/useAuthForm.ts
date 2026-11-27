import { useActionState } from 'react'
import { useNavigate } from 'react-router-dom'
import { emptyAuthState, type AuthFormState } from './actions'
import { useSession } from './session'

export function useAuthForm(submit: (form: FormData) => Promise<AuthFormState>) {
  const { setSession } = useSession()
  const navigate = useNavigate()

  return useActionState(async (_prev: AuthFormState, form: FormData) => {
    const result = await submit(form)
    if (result.session) {
      setSession(result.session)
      navigate('/')
    }
    return result
  }, emptyAuthState)
}
