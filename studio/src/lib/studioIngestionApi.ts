import { isStudioIntegrated } from './studioIntegration'
import { getCortisstyleApiUrl } from './cortisstyleOrigin'
import { getAccessToken } from './supabaseClient'

type IngestionEndpoint = 'remove-bg' | 'analyze-garment'

function getIngestionUrl(endpoint: IngestionEndpoint): string {
  if (isStudioIntegrated()) {
    return `/api/studio/${endpoint}`
  }

  if (import.meta.env.DEV) {
    return `/api/${endpoint}`
  }

  return `${getCortisstyleApiUrl()}/api/studio/${endpoint}`
}

export async function postStudioIngestion(
  endpoint: IngestionEndpoint,
  formData: FormData,
  signal?: AbortSignal,
): Promise<Response> {
  const url = getIngestionUrl(endpoint)
  const headers = new Headers()
  const token = await getAccessToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  headers.set('Authorization', `Bearer ${token}`)

  return fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    signal,
  })
}
