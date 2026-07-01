import { useGarmentLibrary } from '../../hooks/useGarmentLibrary'
import { STUDIO_LABEL, STUDIO_RULE, STUDIO_SECTION_TITLE } from '../../lib/studioUiTokens'
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
      className="group flex w-full items-center gap-3 border border-transparent px-3 py-2.5 text-left transition-colors hover:border-white/[0.08] hover:bg-white/[0.03] disabled:opacity-50"
    >
      <span className="relative flex h-14 w-11 shrink-0 items-center justify-center overflow-hidden border border-white/[0.08] bg-[linear-gradient(45deg,#1a1a1c_25%,transparent_25%,transparent_75%,#1a1a1c_75%,#1a1a1c),linear-gradient(45deg,#1a1a1c_25%,transparent_25%,transparent_75%,#1a1a1c_75%,#1a1a1c)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]">
        <img
          src={record.assetUrl}
          alt=""
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-sans text-[12px] text-zinc-200 group-hover:text-white">
          {title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          {record.category ? (
            <span className="font-sans text-[10px] uppercase tracking-[0.08em] text-zinc-500">
              {record.category}
            </span>
          ) : null}
          <span className="font-sans text-[10px] text-zinc-600">
            {record.pipeline === 'segmented' ? 'cutout' : 'raw'}
          </span>
          <span className="font-sans text-[10px] text-zinc-600">
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
      className={`flex w-64 shrink-0 flex-col border-r ${STUDIO_RULE} bg-[#0F0F10]/95 backdrop-blur-md lg:w-72`}
    >
      <div className={`flex items-center justify-between border-b ${STUDIO_RULE} px-4 py-3`}>
        <div>
          <p className={STUDIO_SECTION_TITLE}>Garment library</p>
          <p className={`mt-1 ${STUDIO_LABEL}`}>Re-place without re-segmenting</p>
        </div>
        <button
          type="button"
          onClick={() => void library.refresh()}
          disabled={library.isLoading}
          className="font-sans text-[10px] uppercase tracking-[0.1em] text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-40"
        >
          Refresh
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {library.isLoading && library.records.length === 0 ? (
          <p className="px-4 py-6 font-sans text-[12px] text-zinc-600">Loading archive…</p>
        ) : null}

        {!library.isLoading && library.records.length === 0 ? (
          <div className="px-4 py-6">
            <p className="font-sans text-[12px] leading-relaxed text-zinc-500">
              Imported garments appear here. Paste or upload once — next time click to place for
              free.
            </p>
          </div>
        ) : null}

        {library.error ? (
          <p className="px-4 py-2 font-sans text-[11px] text-red-400/90">{library.error}</p>
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
