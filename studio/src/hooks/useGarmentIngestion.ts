import { useCallback, useEffect, useRef } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'
import {
  extractClipboardImage,
  ingestPayloadFromFile,
  type IngestImagePayload,
} from '../lib/imageIngestion'
import { runGarmentIngestion } from '../services/garmentIngestionService'

export function useGarmentIngestion() {
  const setIngestionStatus = useWorkspaceStore((s) => s.setIngestionStatus)
  const abortRef = useRef<AbortController | null>(null)

  const ingestPayload = useCallback(
    async (payload: IngestImagePayload) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIngestionStatus('processing', null, 'Processing image…')

      try {
        await runGarmentIngestion(payload, controller.signal)
        setIngestionStatus('idle')
      } catch (error) {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Image ingestion failed'
        setIngestionStatus('error', message)
      }
    },
    [setIngestionStatus],
  )

  const ingestFile = useCallback(
    (file: File) => {
      void ingestPayload(ingestPayloadFromFile(file))
    },
    [ingestPayload],
  )

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }

      const clipboardData = event.clipboardData
      if (!clipboardData) return

      const payload = extractClipboardImage(clipboardData)
      if (!payload) return

      event.preventDefault()
      void ingestPayload(payload)
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [ingestPayload])

  return { ingestPayload, ingestFile }
}
