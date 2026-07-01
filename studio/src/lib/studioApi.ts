import { getStudioApiOrigin } from '../lib/studioIntegration'
import { getAccessToken } from '../lib/supabaseClient'
import type { StudioDraftPayload } from '../lib/draftPayload'

export interface StudioSessionUser {
  id: string
  email: string | null
}

export interface StudioDraftSummary {
  id: string
  lookId: string
  title: string | null
  updatedAt: string
}

export interface StudioDraftRecord {
  id: string
  lookId: string
  title: string | null
  payload: StudioDraftPayload
  createdAt: string
  updatedAt: string
}

async function studioFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${getStudioApiOrigin()}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`

    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore parse errors
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

export async function fetchStudioSession(): Promise<StudioSessionUser> {
  const data = await studioFetch<{ user: StudioSessionUser }>('/api/studio/session')
  return data.user
}

export async function createStudioDraft(
  payload: StudioDraftPayload,
): Promise<StudioDraftRecord> {
  const data = await studioFetch<{ draft: StudioDraftRecord }>('/api/studio/drafts', {
    method: 'POST',
    body: JSON.stringify({ payload, title: payload.lookParams.lookTitle || null }),
  })

  return data.draft
}

export async function loadStudioDraft(draftId: string): Promise<StudioDraftRecord> {
  const data = await studioFetch<{ draft: StudioDraftRecord }>(
    `/api/studio/drafts/${draftId}`,
  )

  return data.draft
}

export async function saveStudioDraft(
  draftId: string,
  payload: StudioDraftPayload,
): Promise<StudioDraftRecord> {
  const data = await studioFetch<{ draft: StudioDraftRecord }>(
    `/api/studio/drafts/${draftId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ payload, title: payload.lookParams.lookTitle || null }),
    },
  )

  return data.draft
}

export async function uploadStudioAsset(params: {
  file: Blob
  fileName: string
  draftId?: string | null
  itemId: string
}): Promise<string> {
  const token = await getAccessToken()

  if (!token) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('file', params.file, params.fileName)
  formData.append('itemId', params.itemId)

  if (params.draftId) {
    formData.append('draftId', params.draftId)
  }

  const response = await fetch(`${getStudioApiOrigin()}/api/studio/assets/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    let message = `Upload failed (${response.status})`

    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      // ignore
    }

    throw new Error(message)
  }

  const data = (await response.json()) as { url: string }
  return data.url
}

export async function uploadBlobAsset(params: {
  blob: Blob
  itemId: string
  draftId?: string | null
  fileName?: string
}): Promise<string> {
  return uploadStudioAsset({
    file: params.blob,
    fileName: params.fileName ?? `${params.itemId}.png`,
    draftId: params.draftId,
    itemId: params.itemId,
  })
}

export async function uploadDataUrlAsset(params: {
  dataUrl: string
  itemId: string
  draftId?: string | null
}): Promise<string> {
  const response = await fetch(params.dataUrl)
  const blob = await response.blob()
  const extension = params.dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png'

  return uploadBlobAsset({
    blob,
    itemId: params.itemId,
    draftId: params.draftId,
    fileName: `${params.itemId}.${extension}`,
  })
}
