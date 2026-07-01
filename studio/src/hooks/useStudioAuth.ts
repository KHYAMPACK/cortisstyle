import { useEffect, useRef, useState } from 'react'
import { getCortisstyleUrl, redirectToStudioLogin } from '../lib/authRedirect'
import {
  consumeAuthHashIfPresent,
  getStudioReturnUrl,
  hasAuthTokensInHash,
} from '../lib/studioAuthHandoff'
import { verifyStudioCuratorAccess } from '../lib/studioAccess'
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '../lib/supabaseClient'
import { isStudioSignOutPending } from '../lib/studioSignOut'
import type { Session } from '@supabase/supabase-js'
import { signOutStudio } from '../lib/studioSignOut'

export type StudioAuthStatus =
  | 'initializing'
  | 'authenticated'
  | 'forbidden'
  | 'unauthenticated'

export interface StudioAuthState {
  status: StudioAuthStatus
  session: Session | null
  email: string | null
  accessMessage: string | null
  signOut: () => Promise<void>
}

function shouldSendToLogin(): boolean {
  return !hasAuthTokensInHash() && !isStudioSignOutPending()
}

function sendToLogin(): void {
  redirectToStudioLogin(getStudioReturnUrl())
}

export function useStudioAuth(): StudioAuthState {
  const [status, setStatus] = useState<StudioAuthStatus>('initializing')
  const [session, setSession] = useState<Session | null>(null)
  const [accessMessage, setAccessMessage] = useState<string | null>(null)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true

    if (!isSupabaseConfigured()) {
      setAccessMessage(
        'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY on cortisstyle.',
      )
      setStatus('unauthenticated')
      return () => {
        activeRef.current = false
      }
    }

    const supabase = getSupabaseClient()

    const verifyAccess = async (nextSession: Session | null) => {
      if (!nextSession) {
        if (!shouldSendToLogin()) return
        if (activeRef.current) setStatus('unauthenticated')
        sendToLogin()
        return
      }

      if (!activeRef.current) return

      try {
        const result = await verifyStudioCuratorAccess()
        if (!activeRef.current) return

        if (result.ok) {
          setSession(nextSession)
          setAccessMessage(null)
          setStatus('authenticated')
          return
        }

        if (result.reason === 'forbidden') {
          setSession(nextSession)
          setAccessMessage(
            result.message ??
              'Your account is not on the curator roster for Lookbook Studio.',
          )
          setStatus('forbidden')
          return
        }

        if (result.reason === 'unauthenticated') {
          setStatus('unauthenticated')
          sendToLogin()
          return
        }

        setSession(nextSession)
        setAccessMessage(result.message ?? 'Unable to verify studio access.')
        setStatus('forbidden')
      } catch (error) {
        if (!activeRef.current) return
        setSession(nextSession)
        setAccessMessage(
          error instanceof Error ? error.message : 'Unable to verify studio access.',
        )
        setStatus('forbidden')
      }
    }

    const bootstrap = async () => {
      try {
        const handoffSession = await consumeAuthHashIfPresent()
        if (handoffSession) {
          await verifyAccess(handoffSession)
          return
        }

        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()

        await verifyAccess(currentSession)
      } catch (error) {
        if (!activeRef.current) return
        setAccessMessage(
          error instanceof Error ? error.message : 'Studio sign-in failed.',
        )
        setStatus('forbidden')
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT' || isStudioSignOutPending()) return
      void verifyAccess(nextSession)
    })

    void bootstrap()

    const loginFallbackTimer = window.setTimeout(() => {
      if (!activeRef.current) return
      void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (!currentSession && shouldSendToLogin()) {
          setStatus('unauthenticated')
          sendToLogin()
        }
      })
    }, 2500)

    return () => {
      activeRef.current = false
      window.clearTimeout(loginFallbackTimer)
      subscription.unsubscribe()
    }
  }, [])

  return {
    status,
    session,
    email: session?.user?.email ?? null,
    accessMessage,
    signOut: signOutStudio,
  }
}

export function getStudioAccessDeniedHomeUrl(): string {
  return getCortisstyleUrl()
}
