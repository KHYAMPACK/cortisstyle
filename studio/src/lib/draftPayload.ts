import type { ArtboardItem, StudioNode } from '../types/item'
import type { LookParameters } from '../types/export'

export interface StudioDraftPayload {
  version: 1
  lookId: string
  lookParams: LookParameters
  studioNodes: StudioNode[]
  artboardItems: ArtboardItem[]
}

export function buildDraftPayload(state: {
  lookId: string
  lookParams: LookParameters
  studioNodes: StudioNode[]
  artboardItems: ArtboardItem[]
}): StudioDraftPayload {
  return {
    version: 1,
    lookId: state.lookId,
    lookParams: state.lookParams,
    studioNodes: state.studioNodes,
    artboardItems: state.artboardItems,
  }
}

export function isStudioDraftPayload(raw: unknown): raw is StudioDraftPayload {
  if (!raw || typeof raw !== 'object') return false

  const record = raw as Partial<StudioDraftPayload>

  return (
    record.version === 1 &&
    typeof record.lookId === 'string' &&
    !!record.lookParams &&
    Array.isArray(record.studioNodes) &&
    Array.isArray(record.artboardItems)
  )
}
