import { Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './features/auth/session'
import { CreateOrg } from './pages/CreateOrg'
import { SignIn } from './pages/SignIn'

function Home() {
  const { session } = useSession()
  if (!session) return <Navigate to="/signin" replace />
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">{session.org.name}</h1>
      <p className="text-sm text-fg-muted">Signed in as {session.user.email}</p>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<CreateOrg />} />
    </Routes>
  )
}
