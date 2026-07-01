import { memo, type ReactNode } from 'react'
import type { ClothingCategory, StudioNode } from '../../types/item'
import { CLOTHING_CATEGORIES } from '../../types/item'
import { useWorkspaceStore } from '../../store/workspaceStore'
import {
  STUDIO_BTN_DANGER,
  STUDIO_CARD,
  STUDIO_INPUT,
  STUDIO_LABEL,
  STUDIO_RULE,
  STUDIO_SECTION_TITLE_SM,
  STUDIO_SURFACE,
} from '../../lib/studioUiTokens'

interface GarmentStudioNodeProps {
  node: StudioNode
  previewImageUrl?: string
  isSelected: boolean
  isDragging?: boolean
  nodeRef?: (el: HTMLDivElement | null) => void
  onDragHandlePointerDown: (nodeId: string, clientX: number, clientY: number) => void
}

function InlineField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className={`block border-b ${STUDIO_RULE} py-1.5 last:border-b-0`}>
      <span className={STUDIO_LABEL}>{label}</span>
      <div className="mt-0.5">{children}</div>
    </label>
  )
}

export const GarmentStudioNode = memo(function GarmentStudioNode({
  node,
  previewImageUrl,
  isSelected,
  isDragging = false,
  nodeRef,
  onDragHandlePointerDown,
}: GarmentStudioNodeProps) {
  const updateStudioNode = useWorkspaceStore((s) => s.updateStudioNode)
  const renameLinkedGarmentId = useWorkspaceStore((s) => s.renameLinkedGarmentId)
  const removeLinkedGarment = useWorkspaceStore((s) => s.removeLinkedGarment)
  const selectLinkedGarment = useWorkspaceStore((s) => s.selectLinkedGarment)

  return (
    <div
      ref={nodeRef}
      className={`absolute w-[280px] ${STUDIO_SURFACE} ${STUDIO_CARD} ${
        isDragging ? '' : 'transition-[border-color,box-shadow] duration-300'
      } ${
        isSelected
          ? 'border-white/30 ring-1 ring-white/10'
          : 'border-white/[0.06] hover:border-white/20'
      }`}
      style={{ left: node.worldX, top: node.worldY }}
      onPointerDown={() => selectLinkedGarment(node.id)}
    >
      <div
        className={`flex cursor-grab items-center justify-between border-b ${STUDIO_RULE} px-4 py-2.5 active:cursor-grabbing`}
        onPointerDown={(event) => {
          event.stopPropagation()
          onDragHandlePointerDown(node.id, event.clientX, event.clientY)
        }}
      >
        <span className={STUDIO_SECTION_TITLE_SM}>Garment</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
          Linked
        </span>
      </div>

      <div className="grid grid-cols-[88px_1fr] gap-4 px-4 pt-3 pb-1">
        <div className="relative">
          <div
            className="relative flex aspect-square items-center justify-center overflow-hidden border border-white/[0.06] bg-[#1a1a1c]"
            title="Linked artboard preview"
          >
            {previewImageUrl ? (
              <img
                src={previewImageUrl}
                alt=""
                draggable={false}
                className="relative z-[1] max-h-full max-w-full object-contain mix-blend-multiply"
              />
            ) : (
              <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-neutral-400">
                —
              </span>
            )}
          </div>
          {previewImageUrl ? (
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-3 left-1/2 h-6 w-[70%] -translate-x-1/2 opacity-30"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(250,250,250,0.35) 0%, transparent 100%)',
                transform: 'translateX(-50%) scaleY(-1)',
                filter: 'blur(4px)',
              }}
            />
          ) : null}
        </div>

        <div className="min-w-0 space-y-0">
          <InlineField label="Item Id">
            <input
              key={node.id}
              className={STUDIO_INPUT}
              defaultValue={node.id}
              onBlur={(e) => renameLinkedGarmentId(node.id, e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </InlineField>

          <InlineField label="Product Name">
            <input
              className={`${STUDIO_INPUT} uppercase tracking-[0.08em]`}
              value={node.name}
              onChange={(e) => updateStudioNode(node.id, { name: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </InlineField>

          <InlineField label="Display Model">
            <input
              className={STUDIO_INPUT}
              value={node.displayModel ?? ''}
              placeholder="Compact Crossbody Archive Bag"
              onChange={(e) => updateStudioNode(node.id, { displayModel: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </InlineField>

          <InlineField label="Brand">
            <input
              className={STUDIO_INPUT}
              value={node.brand}
              onChange={(e) => updateStudioNode(node.id, { brand: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </InlineField>

          <InlineField label="Category">
            <select
              className={`${STUDIO_INPUT} cursor-pointer`}
              value={node.category}
              onChange={(e) =>
                updateStudioNode(node.id, { category: e.target.value as ClothingCategory })
              }
              onPointerDown={(e) => e.stopPropagation()}
            >
              {CLOTHING_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </InlineField>
        </div>
      </div>

      <div className="space-y-0 px-4 pb-2 pt-1">
        <InlineField label="Original Shop Link">
          <input
            className={STUDIO_INPUT}
            value={node.shopUrl}
            onChange={(e) => updateStudioNode(node.id, { shopUrl: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </InlineField>

        <InlineField label="Editorial Pricing">
          <input
            className={STUDIO_INPUT}
            value={node.estPriceRange}
            onChange={(e) => updateStudioNode(node.id, { estPriceRange: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </InlineField>

        <InlineField label="Budget Alternative Link">
          <input
            className={STUDIO_INPUT}
            value={node.budgetAlternativeUrl}
            onChange={(e) =>
              updateStudioNode(node.id, { budgetAlternativeUrl: e.target.value })
            }
            onPointerDown={(e) => e.stopPropagation()}
          />
        </InlineField>
      </div>

      <button
        type="button"
        className={STUDIO_BTN_DANGER}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => removeLinkedGarment(node.id)}
      >
        Delete Garment
      </button>
    </div>
  )
})
