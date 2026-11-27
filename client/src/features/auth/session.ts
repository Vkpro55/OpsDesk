import { createContext, use } from 'react'

export interface Session {
  accessToken: string
  user: { id: string; email: string; name: string }
  org: { id: string; name: string; slug: string }
}

interface SessionContextValue {
  session: Session | null
  setSession: (session: Session | null) => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession() {
  const ctx = use(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
