import { useEffect, useEffectEvent, useRef } from 'react'
import { googleClientId, loadGoogleIdentity } from '../lib/googleIdentity'

interface Props {
  text: 'continue_with' | 'signup_with'
  onCredential: (idToken: string) => void
}

export function GoogleButton({ text, onCredential }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const handleCredential = useEffectEvent(onCredential)

  useEffect(() => {
    if (!googleClientId) return
    let cancelled = false
    loadGoogleIdentity()
      .then((gis) => {
        const el = ref.current
        if (cancelled || !el) return
        gis.initialize({ client_id: googleClientId!, callback: ({ credential }) => handleCredential(credential) })
        gis.renderButton(el, { theme: 'outline', size: 'large', text, width: Math.min(el.offsetWidth, 400) })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [text])

  if (!googleClientId) return null
  return <div ref={ref} className="flex min-h-10 justify-center" />
}
