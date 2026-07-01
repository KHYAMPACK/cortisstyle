import { getCortisstyleMainUrl } from './cortisstyleOrigin'
import { isStudioIntegrated } from './studioIntegration'
import { getStudioReturnUrl } from './studioAuthHandoff'

export function getCortisstyleUrl(): string {
  if (isStudioIntegrated() && typeof window !== 'undefined') {
    return window.location.origin
  }

  return getCortisstyleMainUrl()
}

export function getStudioLoginUrl(returnTo?: string): string {
  const target =
    returnTo ??
    (typeof window !== 'undefined' ? getStudioReturnUrl() : '/studio')

  if (isStudioIntegrated() && typeof window !== 'undefined') {
    const returnUrl = target.startsWith('http')
      ? target
      : `${window.location.origin}${target.startsWith('/') ? target : `/${target}`}`

    return `/auth/studio?returnTo=${encodeURIComponent(returnUrl)}`
  }

  return `${getCortisstyleUrl()}/auth/studio?returnTo=${encodeURIComponent(target)}`
}

export function redirectToStudioLogin(returnTo?: string): void {
  window.location.assign(getStudioLoginUrl(returnTo))
}

export function readDraftIdFromUrl(): string | null {
  const value = new URLSearchParams(window.location.search).get('draft')
  return value?.trim() || null
}

export function setDraftIdInUrl(draftId: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set('draft', draftId)
  window.history.replaceState({}, '', url.toString())
}
