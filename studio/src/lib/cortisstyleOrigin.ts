const DEFAULT_MAIN_URL = 'https://www.cortisstyle.com'
const DEFAULT_API_URL = 'https://www.cortisstyle.com'

/**
 * cortisstyle.com redirects to www on Vercel. Cross-origin fetch preflights fail on
 * redirected OPTIONS responses, so API calls must use the canonical www host.
 */
export function normalizeCortisstyleOrigin(url: string): string {
  try {
    const parsed = new URL(url)

    if (parsed.hostname === 'cortisstyle.com') {
      parsed.hostname = 'www.cortisstyle.com'
    }

    return parsed.toString().replace(/\/$/, '')
  } catch {
    return url.replace(/\/$/, '')
  }
}

export function getCortisstyleMainUrl(): string {
  const configured = import.meta.env.VITE_CORTISSTYLE_URL?.trim()
  return normalizeCortisstyleOrigin(configured || DEFAULT_MAIN_URL)
}

export function getCortisstyleApiUrl(): string {
  const configured =
    import.meta.env.VITE_CORTISSTYLE_API_URL?.trim() ||
    import.meta.env.VITE_CORTISSTYLE_URL?.trim()

  return normalizeCortisstyleOrigin(configured || DEFAULT_API_URL)
}
