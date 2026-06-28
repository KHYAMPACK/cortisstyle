# Cortisstyle — Collage / Outfit Builder Integration Spec

This document describes how to build an external collage or outfit layout tool and export results into the **Cortisstyle** Next.js project. Share this file with any AI or developer building the companion program.

**Repo context:** Fashion lookbook + digital wardrobe. Outfits are flat-lay PNG collages on a fixed 2:3 canvas. Positions are percentage-based anchors plus pixel widths.

---

## 1. Canonical canvas size

All layout math is calibrated to one coordinate space.

| Property | Value | Code constant |
|----------|-------|---------------|
| Canvas width | **420 px** | `LOOK_CANVAS_REFERENCE_WIDTH` |
| Canvas height | **630 px** (2:3 ratio) | `LOOK_CANVAS_REFERENCE_HEIGHT` |
| Look card footer | **56 px** (name + branding) | `MOODBOARD_FOOTER_HEIGHT_PX` |
| Full exported look card | **420 × 686 px** | canvas + footer |

**Source file:** `src/lib/lookCanvasReference.ts`

Your external tool should use **420 × 630** as the design artboard. You may scale the UI for editing, but **export all positions in this reference space**.

---

## 2. Item positioning (`CanvasItemLayout`)

Each clothing PNG on the collage uses this structure:

**Source file:** `src/types/canvas-layout.ts`

```typescript
interface CanvasItemLayout {
  top: string;              // e.g. "12.75%" or "-10.60%"
  left: string;             // e.g. "32.52%"
  widthPx?: number;         // display width in pixels (not %)
  zIndex: number;
  hitboxWidthPx?: number;   // optional — click target only
  hitboxHeightPx?: number;  // optional — click target only
  hitboxOffsetTopPx?: number;
  hitboxOffsetLeftPx?: number;
}
```

### Rules

- **`top` / `left`**: Percentage strings relative to the **420 × 630** container.
- **Negative percentages are valid.** Items often bleed off-canvas (e.g. `"top": "-10.60%"`).
- **`widthPx`**: Absolute pixel width of the rendered PNG. Height is auto (`object-contain`, preserves aspect ratio).
- **Hitbox fields** are optional. They only affect editor click targets, not visual rendering.

### Example (real committed layout)

**File:** `src/data/canvas-layouts/look-01.json`

```json
{
  "black-beanie-01": {
    "top": "-2.18%",
    "left": "36.37%",
    "widthPx": 94,
    "zIndex": 30,
    "hitboxWidthPx": 88,
    "hitboxHeightPx": 66,
    "hitboxOffsetTopPx": 26,
    "hitboxOffsetLeftPx": 5
  },
  "compression-shirt-01": {
    "top": "12.75%",
    "left": "32.52%",
    "widthPx": 140,
    "zIndex": 20,
    "hitboxHeightPx": 160,
    "hitboxOffsetTopPx": 16
  }
}
```

### Fallback: `defaultCanvasPosition`

Before look-specific JSON exists, each item can define a simpler default in `src/data/items.ts`:

```typescript
defaultCanvasPosition: {
  top: "28%",       // % of canvas height
  left: "30%",      // % of canvas width
  width: "40%",     // % of canvas WIDTH → converted to widthPx at runtime
  zIndex: 4,
}
```

**Runtime conversion:** `widthPx = Math.round((width% / 100) × 420)`

**Priority:** Committed look JSON (`look-XX.json`) overrides `defaultCanvasPosition` when both exist.

---

## 3. Z-index / layer stack

**Source file:** `src/lib/canvasLayerStack.ts`

| Constant | Value | Used for |
|----------|-------|----------|
| `CANVAS_LAYER_MOOD` | 10 | Mood image overlay |
| `CANVAS_LAYER_MID` | 20 | Tops, bottoms, waist |
| `CANVAS_LAYER_OUTER` | 25 | Outerwear |
| `CANVAS_LAYER_TOP` | 30 | Shoes, bags, eyewear, hats, head accessories |
| `CANVAS_LAYER_ACTIVE` | 50 | Selection highlight (UI only) |

### Category → default zIndex

| Clothing category | zIndex |
|-------------------|--------|
| tops, bottoms, waist | 20 |
| outerwear | 25 |
| shoes, bags, eyewear, headwear, accessories | 30 |

### Category → wardrobe matrix slot

**Source file:** `src/types/wardrobe-builder.ts`, `src/lib/wardrobeBuilderInventory.ts`

| `ClothingCategory` | Matrix slot filter |
|--------------------|--------------------|
| eyewear | EYEWEAR |
| headwear | HAT |
| accessories | ACC_HEAD |
| outerwear | OUTER |
| tops | TOP |
| bags | BAG |
| shoes | SHOES |
| bottoms | BOTTOM |
| waist | WAIST |

---

## 4. Image asset requirements

### Clothing PNGs (flat-lay cutouts)

- **Path pattern:** `/images/clothes/{outfit-folder}/{item-id}.png`
- **Example:** `/images/clothes/outfit-01/black-beanie-01.png`
- **On disk:** `public/images/clothes/outfit-01/black-beanie-01.png`
- **Format:** PNG with **transparent background**
- **Rendering:** `object-contain`; on light canvases uses `mix-blend-multiply` (white areas knock out)
- **No fixed source pixel size** — display height scales from `widthPx` preserving aspect ratio
- **Editor resize bounds:** min 48 px, max 720 px width (`CollageStudioLayer.tsx`)

### Editor guide image (optional, dev calibration)

- **Default path:** `/images/clothes/{outfit-folder}/combined.png`
- Used as a placement reference in localhost edit mode only

### Mood image overlay (saved look cards)

- **Frame size:** 120 × 160 px (3:4 aspect ratio)
- **Position:** 16 px from top, 16 px from right (`top-4 right-4`)
- **Upload limits:** max 720 px longest edge, JPEG, ~400 KB when stored as data URL
- **Source file:** `src/components/wardrobe/WardrobeMoodImageFrame.tsx`, `src/lib/compressMoodImage.ts`

### Canvas background colors (user outfits)

**Source file:** `src/lib/wardrobeCanvasBackground.ts`

| Hex | Label |
|-----|-------|
| `#FFFFFF` | Crisp White (default) |
| `#0D0D0D` | Jet Black |
| `#E3EDF7` | Blueprint Ice |
| `#F4F6F8` | Editorial Gray |

---

## 5. Two export paths

### Path A — Editorial lookbook look (curated SS26 looks)

Use when calibrating a **published look** that appears on the homepage and can be added to a user's wardrobe.

**Export these artifacts:**

#### 1. Canvas layout JSON

**Destination:** `src/data/canvas-layouts/look-XX.json`

```json
{
  "item-id-here": {
    "top": "12.75%",
    "left": "32.52%",
    "widthPx": 140,
    "zIndex": 20
  }
}
```

#### 2. Clothing item entries

**Destination:** `src/data/items.ts` (or use `npm run item:draft` pipeline)

Minimum fields per item:

```typescript
{
  id: "compression-shirt-01",
  name: "COMPRESSION SHIRT",
  category: "tops",  // ClothingCategory enum — see section 3
  brand: "...",
  blurredDescription: "...",
  unlockedDescription: "...",
  shopUrl: "...",
  rarityScore: 1-5,
  canvasImage: "/images/clothes/outfit-01/compression-shirt-01.png",
  defaultCanvasPosition: {
    top: "28%",
    left: "30%",
    width: "40%",
    zIndex: 6,
  },
}
```

**Valid `ClothingCategory` values:** `headwear`, `eyewear`, `tops`, `outerwear`, `bottoms`, `shoes`, `bags`, `waist`, `accessories`

#### 3. Look definition

**Destination:** `src/data/looks.ts`

```typescript
{
  id: "look-01",
  title: "Look 01 — ...",
  layout: "collage",
  outfitId: "outfit-01",
  image: "/images/clothes/outfit-01/....WEBP",
  modelName: "...",
  guidePrice: 349,
  width: 1700,
  height: 2500,
  items: [
    {
      itemId: "compression-shirt-01",
      coordinates: {
        from: { top: "36%", left: "48%" },
        to: { top: "40%", left: "20%" },
      },
    },
  ],
}
```

> **Note:** `coordinates.from` / `coordinates.to` are leader-line hotspot positions for the look **modal shop UI**. They are **not** used for collage canvas placement. Collage placement comes from `look-XX.json` + `defaultCanvasPosition`.

#### Dev import API (localhost only)

```
POST /api/save-canvas-layout
Content-Type: application/json

{
  "lookId": "look-01",
  "layouts": { ...CanvasItemLayout map... }
}
```

Writes directly to `src/data/canvas-layouts/look-01.json` and regenerates the index.

---

### Path B — User wardrobe outfit (builder + saved archive)

Use when a user composes an outfit in the wardrobe builder and saves it.

**Type:** `SavedWardrobeOutfitBlueprint` (`src/types/wardrobe-builder.ts`)

```typescript
{
  id: "uuid",
  name: "LOOK 01",
  moodword: "EDITORIAL",
  moodImageUrl: "data:image/jpeg;base64,..." | "/images/...",
  canvasBg: "#FFFFFF",
  savedAt: "2026-06-21T12:00:00.000Z",
  slots: WardrobeOutfitMatrix,           // 9 entries — see below
  layoutOverrides?: {                  // optional free-drag positions
    "item-id": { top: 15.2, left: 33.1 }  // numbers = percent (not strings)
  },
}
```

**Database table:** `user_saved_outfits` (Supabase)  
**Source file:** `src/lib/savedWardrobeOutfitDb.ts`

#### Wardrobe slot matrix (exactly 9 slots)

| Index | Label | `categoryFilter` |
|-------|-------|------------------|
| 0 | eyewear | EYEWEAR |
| 1 | hat | HAT |
| 2 | acc_head | ACC_HEAD |
| 3 | outer | OUTER |
| 4 | top | TOP |
| 5 | bag | BAG |
| 6 | shoes | SHOES |
| 7 | bottom | BOTTOM |
| 8 | waist | WAIST |

Each slot is `null` or:

```typescript
{
  id: "compression-shirt-01",
  categoryFilter: "TOP",
  slotIndex: 4,
  sourceLookId: "look-01",  // which look-XX.json supplies layout positions
}
```

#### How wardrobe builder resolves positions

1. For each equipped item, load layout from `src/data/canvas-layouts/{sourceLookId}.json`
2. Fall back to item's `defaultCanvasPosition` if no committed layout
3. Apply category-based zIndex stack (section 3)
4. Merge `layoutOverrides` if user dragged items in free-drag mode

**Free-drag bounds:** `top` / `left` roughly **-50% to 120%** of canvas  
**Source:** `src/lib/wardrobeDragLayout.ts` — `DRAG_LAYOUT_PERCENT_MIN`, `DRAG_LAYOUT_PERCENT_MAX`

---

## 6. Coordinate math

### Reference artboard: 420 × 630 px

**Pixel → export strings:**

```
left = ((anchorX_px / 420) * 100).toFixed(2) + "%"
top  = ((anchorY_px / 630) * 100).toFixed(2) + "%"
widthPx = Math.round(displayWidth_px)
```

**Export strings → pixel (for preview in your tool):**

```
anchorX_px = (parseFloat(left) / 100) * 420
anchorY_px = (parseFloat(top) / 100) * 630
displayHeight_px = widthPx * (imageNaturalHeight / imageNaturalWidth)
```

### Default width conversion

When using `defaultCanvasPosition.width` as a percentage:

```
widthPx = Math.round((parseFloat(width.replace("%", "")) / 100) * 420)
```

At reference width 420, `"40%"` → `168 px`.

---

## 7. Key source files (quick reference)

| File | Purpose |
|------|---------|
| `src/lib/lookCanvasReference.ts` | Canvas dimensions (420×630) |
| `src/types/canvas-layout.ts` | `CanvasItemLayout` type |
| `src/data/canvas-layouts/*.json` | Committed per-look layouts |
| `src/data/items.ts` | Master clothing catalog |
| `src/data/looks.ts` | Lookbook look definitions |
| `src/types/wardrobe-builder.ts` | Wardrobe slots, saved outfit blueprint |
| `src/lib/canvasLayout.ts` | Layout resolution + merge logic |
| `src/lib/canvasLayerStack.ts` | zIndex layer constants |
| `src/lib/wardrobeBuilderLook.ts` | Wardrobe builder layout resolution |
| `src/lib/wardrobeCanvasBackground.ts` | Allowed canvas background colors |
| `src/lib/savedWardrobeOutfitDb.ts` | Supabase save/load for user outfits |
| `src/lib/lookToWardrobeBlueprint.ts` | Convert lookbook look → wardrobe matrix |
| `src/app/api/save-canvas-layout/route.ts` | Dev API to write layout JSON |
| `src/lib/itemDraft/` | Pipeline to generate new item snippets |

---

## 8. Existing repo tooling

| Command / API | Purpose |
|---------------|---------|
| `npm run item:draft` | Generate item metadata + TypeScript snippets from a PNG |
| `POST /api/save-canvas-layout` | Save look layout JSON (localhost dev only) |
| Item draft output | Produces `canvasImage` path + default `defaultCanvasPosition` stub |

**Item draft input shape** (`src/lib/itemDraft/types.ts`):

```typescript
{
  name: string,
  shopUrl: string,
  pngPath: string,
  outfitFolder: string,  // e.g. "outfit-04"
  id?: string,
  brandOverride?: string,
}
```

**Generated canvas image path pattern:**

```
/images/clothes/{outfitFolder}/{id}.png
```

---

## 9. Minimum viable export checklist

### For a new editorial lookbook look

- [ ] PNG cutouts in `public/images/clothes/outfit-XX/{item-id}.png`
- [ ] Layout JSON in `src/data/canvas-layouts/look-XX.json`
- [ ] Item entries in `src/data/items.ts` with `canvasImage` + `defaultCanvasPosition`
- [ ] Look entry in `src/data/looks.ts` with `layout: "collage"` and `items[]` placements
- [ ] Optional: `combined.png` guide in same outfit folder

### For a user wardrobe outfit

- [ ] Item IDs that exist in catalog (user must own them via wardrobe)
- [ ] 9-slot matrix with equipped items + `sourceLookId` per item
- [ ] Optional `layoutOverrides` for custom drag positions (percent as numbers)
- [ ] Optional `moodImageUrl`, `moodword`, `canvasBg`, `name`

---

## 10. Homepage / gating constants (optional context)

**Source file:** `src/lib/launchGates.ts`

| Constant | Value | Meaning |
|----------|-------|---------|
| `HOMEPAGE_PUBLIC_LOOK_COUNT` | 6 | Looks shown on homepage grid |
| `HOMEPAGE_FREE_LOOK_COUNT` | 3 | Unlocked (interactive) looks on homepage |
| `FREE_TIER_SAVED_OUTFIT_LIMIT` | 3 | Max saved outfits per user |

**Look order on homepage:** `HOMEPAGE_LOOK_ORDER` in `src/data/looks.ts`

---

## 11. What you do NOT need to replicate

- Leader-line hotspot coordinates in `looks.ts` — shop modal UI only, not collage canvas
- Hitbox fields — optional unless you need pixel-perfect click targets in the in-app editor
- Style guide PDF pipeline — separate from collage layout
- `guidePrice`, Shopier checkout — commerce layer, not layout

---

## 12. Rendering notes (for visual parity)

- Light canvas: clothing layer uses CSS `mix-blend-multiply`
- Dark canvas (`#0D0D0D`): no multiply; white drop-shadow on PNG edges instead
- Collage backdrop default: `#ffffff` (`COLLAGE_BACKDROP` in `src/lib/collageLayout.ts`)
- Look card footer text: outfit name (left) + "build your own / cortisstyle.com" (right), 56 px strip

---

## 13. Example: full minimal look export package

```
public/images/clothes/outfit-07/
  jacket-01.png
  skirt-01.png
  boots-01.png
  combined.png          (optional guide)

src/data/canvas-layouts/look-07.json
src/data/items.ts       (add 3 defineItem entries)
src/data/looks.ts       (add 1 look entry, layout: "collage")
```

**look-07.json:**

```json
{
  "jacket-01": { "top": "8%", "left": "25%", "widthPx": 180, "zIndex": 25 },
  "skirt-01":  { "top": "42%", "left": "30%", "widthPx": 160, "zIndex": 20 },
  "boots-01":  { "top": "68%", "left": "10%", "widthPx": 200, "zIndex": 30 }
}
```

---

*Generated for Cortisstyle project integration. Last aligned with codebase structure as of SS26 wardrobe builder.*
