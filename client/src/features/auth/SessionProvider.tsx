import { useState, type ReactNode } from 'react'
import { SessionContext, type Session } from './session'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  return <SessionContext value={{ session, setSession }}>{children}</SessionContext>
}
