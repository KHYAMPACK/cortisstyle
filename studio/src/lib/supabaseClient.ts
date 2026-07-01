import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { createSharedAuthStorage } from './supabaseCookieStorage'

let browserClient: SupabaseClient | null = null

function getSupabaseUrl(): string | undefined {
  return import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
}

function getSupabaseAnonKey(): string | undefined {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}

export function getSupabaseClient(): SupabaseClient {
  const url = getSupabaseUrl()
  const anonKey = getSupabaseAnonKey()

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on cortisstyle.',
    )
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: createSharedAuthStorage(),
      },
    })
  }

  return browserClient
}

export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null

  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession()

  return session?.access_token ?? null
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null

  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession()

  return session
}
