import { getSupabaseClient } from './supabaseClient'
import type { Session } from '@supabase/supabase-js'

export function hasAuthTokensInHash(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hash.includes('access_token=')
}

/** Strip hash from the current URL (after tokens are consumed). */
export function stripAuthHashFromUrl(): void {
  if (typeof window === 'undefined' || !window.location.hash) return

  const url = new URL(window.location.href)
  url.hash = ''
  window.history.replaceState({}, '', `${url.pathname}${url.search}`)
}

/**
 * After cortisstyle redirects here with #access_token=…, persist the session
 * before any "am I logged in?" checks run.
 */
export async function consumeAuthHashIfPresent(): Promise<Session | null> {
  if (!hasAuthTokensInHash()) return null

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) return null

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  stripAuthHashFromUrl()

  if (error) {
    console.error('[studio-auth] token handoff failed:', error.message)
    return null
  }

  return data.session
}

export function getStudioReturnUrl(): string {
  return `${window.location.origin}${window.location.pathname}${window.location.search}`
}
