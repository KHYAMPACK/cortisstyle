import { useCallback, useEffect, useRef, useState } from 'react'
import { buildDraftPayload } from '../lib/draftPayload'
import {
  clearLocalDraftBackup,
  loadLocalDraftBackup,
  saveLocalDraftBackup,
} from '../lib/localDraftBackup'
import {
  createStudioDraft,
  loadStudioDraft,
  saveStudioDraft,
} from '../lib/studioApi'
import { readDraftIdFromUrl, setDraftIdInUrl } from '../lib/authRedirect'
import { isStudioDraftPayload } from '../lib/draftPayload'
import { useWorkspaceStore } from '../store/workspaceStore'
import { syncImportCacheMetadata } from '../lib/syncImportCacheMetadata'

const AUTOSAVE_MS = 2500

export type DraftLoadState = 'idle' | 'loading' | 'ready' | 'error'
export type DraftSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export function useDraftAutosave(enabled: boolean) {
  const [draftId, setDraftId] = useState<string | null>(() => readDraftIdFromUrl())
  const [loadState, setLoadState] = useState<DraftLoadState>('idle')
  const [saveState, setSaveState] = useState<DraftSaveState>('idle')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const lookId = useWorkspaceStore((s) => s.lookId)
  const lookParams = useWorkspaceStore((s) => s.lookParams)
  const studioNodes = useWorkspaceStore((s) => s.studioNodes)
  const artboardItems = useWorkspaceStore((s) => s.artboardItems)
  const hydrateFromDraft = useWorkspaceStore((s) => s.hydrateFromDraft)
  const setStoreDraftId = useWorkspaceStore((s) => s.setDraftId)

  const hydratedRef = useRef(false)
  const saveTimerRef = useRef<number | null>(null)
  const lastSavedRef = useRef<string>('')

  const buildSnapshot = useCallback(() => {
    return JSON.stringify(
      buildDraftPayload({
        lookId,
        lookParams,
        studioNodes,
        artboardItems,
      }),
    )
  }, [lookId, lookParams, studioNodes, artboardItems])

  const persistDraft = useCallback(async () => {
    const payload = buildDraftPayload({
      lookId,
      lookParams,
      studioNodes,
      artboardItems,
    })

    setSaveState('saving')
    setSaveError(null)

    try {
      let activeDraftId = draftId

      if (!activeDraftId) {
        const created = await createStudioDraft(payload)
        activeDraftId = created.id
        setDraftId(created.id)
        setStoreDraftId(created.id)
        setDraftIdInUrl(created.id)
      } else {
        await saveStudioDraft(activeDraftId, payload)
      }

      clearLocalDraftBackup(activeDraftId)
      lastSavedRef.current = JSON.stringify(payload)
      setSaveState('saved')

      syncImportCacheMetadata(payload.studioNodes).catch((err) =>
        console.warn('[autosave] import cache sync skipped:', err),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Autosave failed'
      setSaveError(message)
      setSaveState('error')

      if (draftId) {
        saveLocalDraftBackup(
          draftId,
          buildDraftPayload({ lookId, lookParams, studioNodes, artboardItems }),
        )
      }
    }
  }, [draftId, lookId, lookParams, studioNodes, artboardItems, setStoreDraftId])

  useEffect(() => {
    if (!enabled || hydratedRef.current) return

    const urlDraftId = readDraftIdFromUrl()

    if (!urlDraftId) {
      hydratedRef.current = true
      setLoadState('ready')
      lastSavedRef.current = buildSnapshot()
      return
    }

    setLoadState('loading')

    void (async () => {
      try {
        const record = await loadStudioDraft(urlDraftId)
        hydrateFromDraft(record.payload, record.id)
        setDraftId(record.id)
        setStoreDraftId(record.id)
        hydratedRef.current = true
        lastSavedRef.current = JSON.stringify(record.payload)
        setLoadState('ready')
      } catch (error) {
        const backup = loadLocalDraftBackup(urlDraftId)

        if (backup && isStudioDraftPayload(backup)) {
          hydrateFromDraft(backup, urlDraftId)
          setDraftId(urlDraftId)
          setStoreDraftId(urlDraftId)
          hydratedRef.current = true
          setLoadState('ready')
          setSaveState('dirty')
          return
        }

        const message = error instanceof Error ? error.message : 'Unable to load draft'
        setLoadError(message)
        setLoadState('error')
      }
    })()
  }, [enabled, buildSnapshot, hydrateFromDraft, setStoreDraftId])

  useEffect(() => {
    if (!enabled || loadState !== 'ready') return

    const snapshot = buildSnapshot()

    if (snapshot === lastSavedRef.current) return

    setSaveState('dirty')

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistDraft()
    }, AUTOSAVE_MS)

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [
    enabled,
    loadState,
    buildSnapshot,
    persistDraft,
    lookId,
    lookParams,
    studioNodes,
    artboardItems,
  ])

  useEffect(() => {
    if (!enabled || loadState !== 'ready') return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      const snapshot = buildSnapshot()
      if (snapshot === lastSavedRef.current) return

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [enabled, loadState, buildSnapshot])

  return {
    draftId,
    loadState,
    loadError,
    saveState,
    saveError,
  }
}
