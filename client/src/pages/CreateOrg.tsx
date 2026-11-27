import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '../components/ui/Button'
import { FormError } from '../components/ui/FormError'
import { Input } from '../components/ui/Input'
import { signUp } from '../features/auth/actions'
import { useAuthForm } from '../features/auth/useAuthForm'

export function CreateOrg() {
  const [state, action, pending] = useAuthForm(signUp)
  const { values, fieldErrors } = state

  return (
    <AuthLayout
      wide
      title="Create your organization"
      subtitle="You'll be the owner. Invite your team next."
      footer={
        <>
          Already have an account? <Link to="/signin">Sign in</Link>
        </>
      }
    >
      <form action={action} className="flex flex-col gap-4">
        <FormError message={state.formError} />
        <Input
          label="Organization name"
          name="orgName"
          required
          minLength={2}
          maxLength={80}
          hint="Customers see this on their portal and in emails."
          defaultValue={values.orgName}
          error={fieldErrors.orgName}
        />
        <Input
          label="Your name"
          name="name"
          autoComplete="name"
          required
          maxLength={80}
          defaultValue={values.name}
          error={fieldErrors.name}
        />
        <Input
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={values.email}
          error={fieldErrors.email}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          hint="At least 8 characters."
          error={fieldErrors.password}
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create organization'}
        </Button>
      </form>
    </AuthLayout>
  )
}
