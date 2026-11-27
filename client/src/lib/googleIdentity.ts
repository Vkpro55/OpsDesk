interface GoogleIdentity {
  initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void
  renderButton(
    parent: HTMLElement,
    options: { theme: 'outline'; size: 'large'; text: 'continue_with' | 'signup_with'; width: number },
  ): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } }
  }
}

export const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID

let loading: Promise<GoogleIdentity> | undefined

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('GIS missing')))
    script.onerror = () => {
      loading = undefined
      reject(new Error('GIS failed to load'))
    }
    document.head.append(script)
  })
  return loading
}
