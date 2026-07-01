import { useCallback, useEffect, useState } from 'react'
import {
  IMPORT_CACHE_UPDATED_EVENT,
} from '../lib/placeGarmentFromCache'
import {
  listImportCache,
  touchImportCache,
  type StudioImportCacheRecord,
} from '../lib/studioImportCacheApi'
import { placeGarmentFromCacheRecord } from '../lib/placeGarmentFromCache'

export function useGarmentLibrary() {
  const [records, setRecords] = useState<StudioImportCacheRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [placingId, setPlacingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const next = await listImportCache()
      setRecords(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load garment library'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onUpdated = () => {
      void refresh()
    }

    window.addEventListener(IMPORT_CACHE_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(IMPORT_CACHE_UPDATED_EVENT, onUpdated)
  }, [refresh])

  const placeRecord = useCallback(async (record: StudioImportCacheRecord) => {
    setPlacingId(record.id)

    try {
      placeGarmentFromCacheRecord(record)
      const updated = await touchImportCache(record.id)
      setRecords((current) => {
        const without = current.filter((item) => item.id !== updated.id)
        return [updated, ...without]
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to place garment'
      setError(message)
    } finally {
      setPlacingId(null)
    }
  }, [])

  return {
    records,
    isLoading,
    error,
    placingId,
    refresh,
    placeRecord,
  }
}
