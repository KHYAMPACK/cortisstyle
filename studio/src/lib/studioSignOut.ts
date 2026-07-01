import { getCortisstyleUrl } from './authRedirect'
import { getSupabaseClient } from './supabaseClient'

let studioSignOutPending = false

export function isStudioSignOutPending(): boolean {
  return studioSignOutPending
}

/** Sign out of studio and return to the main cortisstyle site (not back into studio login). */
export async function signOutStudio(): Promise<void> {
  studioSignOutPending = true
  const target = getCortisstyleUrl()

  try {
    await getSupabaseClient().auth.signOut()
  } finally {
    window.location.replace(target)
  }
}
