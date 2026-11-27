import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { FormError } from '../components/ui/FormError'
import { Input } from '../components/ui/Input'
import { signIn } from '../features/auth/actions'
import { useAuthForm } from '../features/auth/useAuthForm'

export function SignIn() {
  const [state, action, pending] = useAuthForm(signIn)

  return (
    <AuthLayout
      title="Sign in to OpsDesk"
      subtitle="Use the email your team invited."
      footer={
        <>
          New to OpsDesk? <Link to="/signup">Create an organization</Link>
        </>
      }
    >
      <form action={action} className="flex flex-col gap-4">
        <FormError message={state.formError} />
        <Input
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values.email}
          error={state.fieldErrors.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state.fieldErrors.password}
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
