/** Cross-subdomain Supabase session storage on `.cortisstyle.com` (production). */

const COOKIE_DOMAIN = '.cortisstyle.com'

function isSecureCookieContext(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:'
}

function resolveCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const host = window.location.hostname

  if (host === 'localhost' || host === '127.0.0.1') {
    return undefined
  }

  if (host.endsWith('cortisstyle.com')) {
    return COOKIE_DOMAIN
  }

  return undefined
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const prefix = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(';')

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length))
    }
  }

  return null
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return

  const domain = resolveCookieDomain()
  const secure = isSecureCookieContext()
  const encoded = encodeURIComponent(value)
  const chunks: string[] = [
    `${encodeURIComponent(name)}=${encoded}`,
    'path=/',
    `max-age=${maxAgeSeconds}`,
    'SameSite=Lax',
  ]

  if (domain) {
    chunks.push(`domain=${domain}`)
  }

  if (secure) {
    chunks.push('Secure')
  }

  document.cookie = chunks.join('; ')
}

function deleteCookie(name: string): void {
  writeCookie(name, '', 0)
}

export function createSharedAuthStorage(): {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
} {
  return {
    getItem(key: string) {
      const fromCookie = readCookie(key)
      if (fromCookie !== null) return fromCookie

      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setItem(key: string, value: string) {
      const domain = resolveCookieDomain()

      if (domain) {
        writeCookie(key, value, 60 * 60 * 24 * 400)
      }

      try {
        localStorage.setItem(key, value)
      } catch {
        // ignore
      }
    },
    removeItem(key: string) {
      deleteCookie(key)

      try {
        localStorage.removeItem(key)
      } catch {
        // ignore
      }
    },
  }
}
