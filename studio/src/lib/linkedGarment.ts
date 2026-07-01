import {
  LOOK_CANVAS_REFERENCE_HEIGHT,
  LOOK_CANVAS_REFERENCE_WIDTH,
} from './lookCanvasReference'
import { initialPlacementWidth } from './canvasLayout'
import { centerPlacement } from './artboardBounds'

export const WORLD_WIDTH = 2400
export const WORLD_HEIGHT = 1600

const NODE_CARD_WIDTH = 280
const NODE_ARTBOARD_GAP = 48
/** Approximate stacked card height — keeps new nodes below existing ones */
export const NODE_CARD_ESTIMATED_HEIGHT = 340
const NODE_VERTICAL_STACK_GAP = 20

export function artboardWorldOrigin() {
  return {
    left: WORLD_WIDTH / 2 - LOOK_CANVAS_REFERENCE_WIDTH / 2,
    top: WORLD_HEIGHT / 2 - LOOK_CANVAS_REFERENCE_HEIGHT / 2,
  }
}

/** Place the next data node below existing studio nodes (left of artboard). */
export function nextNodeWorldPosition(nodes: Array<{ worldY: number }>) {
  const { left, top } = artboardWorldOrigin()
  const worldX = left - NODE_CARD_WIDTH - NODE_ARTBOARD_GAP

  if (nodes.length === 0) {
    return { worldX, worldY: top }
  }

  const lowestY = Math.max(...nodes.map((node) => node.worldY))
  return {
    worldX,
    worldY: lowestY + NODE_CARD_ESTIMATED_HEIGHT + NODE_VERTICAL_STACK_GAP,
  }
}

/** @deprecated Use `nextNodeWorldPosition` — kept for tests */
export function defaultNodeWorldPosition(stackIndex: number) {
  const { left, top } = artboardWorldOrigin()
  return {
    worldX: left - NODE_CARD_WIDTH - NODE_ARTBOARD_GAP,
    worldY: top + stackIndex * (NODE_CARD_ESTIMATED_HEIGHT + NODE_VERTICAL_STACK_GAP),
  }
}

/** Center of the 420×630 reference artboard */
export function artboardCenterPlacement(
  naturalWidth: number,
  naturalHeight: number,
  stackIndex = 0,
) {
  const widthPx = initialPlacementWidth(naturalWidth)
  const centerX = LOOK_CANVAS_REFERENCE_WIDTH / 2 + stackIndex * 12
  const centerY = LOOK_CANVAS_REFERENCE_HEIGHT / 2 + stackIndex * 12
  return centerPlacement(naturalWidth, naturalHeight, centerX, centerY, widthPx)
}
