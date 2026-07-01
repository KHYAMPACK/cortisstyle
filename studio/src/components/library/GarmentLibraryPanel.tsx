import { useGarmentLibrary } from '../../hooks/useGarmentLibrary'
import {
  STUDIO_BTN_GHOST,
  STUDIO_CHROME_BG,
  STUDIO_KICKER,
  STUDIO_LABEL,
  STUDIO_RULE,
  STUDIO_SECTION_TITLE,
  STUDIO_SURFACE,
} from '../../lib/studioUiTokens'
import type { StudioImportCacheRecord } from '../../lib/studioImportCacheApi'

function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(deltaMs / 60_000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours}h ago`

  const days = Math.round(hours / 24)
  return `${days}d ago`
}

function recordTitle(record: StudioImportCacheRecord): string {
  if (record.productName?.trim()) return record.productName.trim()
  if (record.sourceFilename?.trim()) return record.sourceFilename.trim()
  return record.itemIdSlug
}

function GarmentLibraryItem({
  record,
  isPlacing,
  onPlace,
}: {
  record: StudioImportCacheRecord
  isPlacing: boolean
  onPlace: () => void
}) {
  const title = recordTitle(record)

  return (
    <button
      type="button"
      onClick={onPlace}
      disabled={isPlacing}
      className={`group mx-3 mb-2 flex w-[calc(100%-1.5rem)] items-center gap-3 border border-blueprint-border ${STUDIO_SURFACE} p-2.5 text-left transition-colors hover:border-jet-black disabled:opacity-50`}
    >
      <span className="relative flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden border border-blueprint-border bg-neutral-100">
        <img
          src={record.assetUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-[11px] tracking-[0.08em] text-neutral-900 uppercase group-hover:text-jet-black">
          {title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          {record.category ? (
            <span className={STUDIO_LABEL}>{record.category}</span>
          ) : null}
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-400">
            {record.pipeline === 'segmented' ? 'cutout' : 'raw'}
          </span>
          <span className="font-mono text-[9px] text-neutral-400">
            · {formatRelativeTime(record.lastUsedAt)}
          </span>
        </span>
      </span>
    </button>
  )
}

export function GarmentLibraryPanel() {
  const library = useGarmentLibrary()

  return (
    <aside
      className={`flex w-64 shrink-0 flex-col border-r ${STUDIO_RULE} ${STUDIO_CHROME_BG} lg:w-72`}
    >
      <div className={`flex items-start justify-between border-b ${STUDIO_RULE} px-4 py-4`}>
        <div>
          <p className={STUDIO_KICKER}>Import Archive</p>
          <h2 className={`mt-1 ${STUDIO_SECTION_TITLE}`}>Garment Library</h2>
          <p className={`mt-2 ${STUDIO_LABEL}`}>Re-place without re-segmenting</p>
        </div>
        <button
          type="button"
          onClick={() => void library.refresh()}
          disabled={library.isLoading}
          className={`${STUDIO_BTN_GHOST} shrink-0 disabled:opacity-40`}
        >
          Refresh
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        {library.isLoading && library.records.length === 0 ? (
          <p className={`px-4 py-6 ${STUDIO_LABEL}`}>Loading archive…</p>
        ) : null}

        {!library.isLoading && library.records.length === 0 ? (
          <div className="px-4 py-6">
            <p className="font-sans text-[12px] leading-relaxed text-meta">
              Imported garments appear here. Paste or upload once — next time click to place for
              free.
            </p>
          </div>
        ) : null}

        {library.error ? (
          <p className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-red-700">
            {library.error}
          </p>
        ) : null}

        <div className="flex flex-col">
          {library.records.map((record) => (
            <GarmentLibraryItem
              key={record.id}
              record={record}
              isPlacing={library.placingId === record.id}
              onPlace={() => void library.placeRecord(record)}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
