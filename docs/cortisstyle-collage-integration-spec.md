# Cortisstyle — Collage / Outfit Builder Integration Spec

This document describes how to build an external collage or outfit layout tool and export results into the **Cortisstyle** Next.js project. Share it with any developer or AI building a companion layout program.

**Repo:** Fashion lookbook + digital wardrobe. Outfits are flat-lay PNG collages on a fixed **420 × 630** artboard. Positions use percentage anchors plus pixel widths.

---

## 1. Canonical canvas size

All layout math is calibrated to one coordinate space.


| Property                | Value            | Code constant                  |
| ----------------------- | ---------------- | ------------------------------ |
| Canvas width            | **420 px**       | `LOOK_CANVAS_REFERENCE_WIDTH`  |
| Canvas height           | **630 px** (2:3) | `LOOK_CANVAS_REFERENCE_HEIGHT` |
| Look card footer        | **56 px**        | `MOODBOARD_FOOTER_HEIGHT_PX`   |
| Full exported look card | **420 × 686 px** | canvas + footer                |


**Source:** `src/lib/lookCanvasReference.ts`

Your external tool should design on **420 × 630**. You may scale the UI for editing, but **export all positions in this reference space**.

The in-app editor (`CollageStudioLayer`) and wardrobe preview (`WardrobeOutfitLivePreviewCard`) both render at this size, then CSS-scale for display.

---



## 2. Item positioning (`CanvasItemLayout`)

Each clothing PNG on the collage uses:

**Source:** `src/types/canvas-layout.ts`

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

- `top` **/** `left`: Percentage strings relative to the **420 × 630** container.
- **Negative percentages are valid.** Items often bleed off-canvas (e.g. `"top": "-2.18%"`).
- `widthPx`: Absolute pixel width of the rendered PNG. Height is auto (`object-contain`, preserves aspect ratio).
- **Hitbox fields** affect editor click targets and hit-testing only. They do not change visual rendering.



### Example (committed layout)

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

Each item can define a simpler default in `src/data/items.ts`:

```typescript
defaultCanvasPosition: {
  top: "28%",       // % of canvas height
  left: "30%",      // % of canvas width
  width: "40%",     // % of canvas WIDTH → converted to widthPx at runtime
  zIndex: 4,
}
```

**Runtime conversion:** `widthPx = Math.round((width% / 100) × 420)`

### Layout resolution priority

**Source:** `src/lib/canvasLayout.ts` → `resolveCanvasLayouts()`

1. Build defaults from each item's `defaultCanvasPosition`
2. Merge **committed look JSON** (`src/data/canvas-layouts/look-XX.json`) — overrides defaults
3. On **localhost only**, merge `localStorage` key `cortis-layout-{lookId}` (editor scratch state)
4. Apply category-based z-index stack (section 3)

---



## 3. Z-index / layer stack

**Source:** `src/lib/canvasLayerStack.ts`


| Constant              | Value | Used for                                     |
| --------------------- | ----- | -------------------------------------------- |
| `CANVAS_LAYER_MOOD`   | 10    | Mood image overlay (wardrobe cards)          |
| `CANVAS_LAYER_MID`    | 20    | Tops, bottoms, waist                         |
| `CANVAS_LAYER_OUTER`  | 25    | Outerwear                                    |
| `CANVAS_LAYER_TOP`    | 30    | Shoes, bags, eyewear, hats, head accessories |
| `CANVAS_LAYER_ACTIVE` | 50    | Selection highlight (UI only)                |


At runtime, `applyFlatLayLayerStackFromClothingItems()` may **override** per-item `zIndex` in JSON based on clothing category.

### Category → default zIndex


| `ClothingCategory`                          | zIndex |
| ------------------------------------------- | ------ |
| tops, bottoms, waist                        | 20     |
| outerwear                                   | 25     |
| shoes, bags, eyewear, headwear, accessories | 30     |




### Category → wardrobe matrix slot

**Source:** `src/lib/wardrobeBuilderInventory.ts` → `inferMatrixCategories()`


| `ClothingCategory` | Matrix filter(s) |
| ------------------ | ---------------- |
| eyewear            | EYEWEAR          |
| headwear           | HAT              |
| accessories        | ACC_HEAD         |
| outerwear          | OUTER            |
| tops               | TOP              |
| bags               | BAG              |
| shoes              | SHOES            |
| bottoms            | BOTTOM           |
| waist              | WAIST            |


---



## 4. Clothing catalog (`items.ts`)

All clothing lives in a **single file**: `src/data/items.ts`.

Each item is registered with `defineItem()`:

```typescript
defineItem(
  "black-beanie-01",        // id (stable key everywhere)
  "BLACK BEANIE",           // display name (uppercase in UI)
  "headwear",               // ClothingCategory
  "Chanel",                 // brand
  {
    shopUrl: "https://...",              // optional — defaults to shopier.com/cortis/{id}
    displayModel: "Lace-up Knit Cap",    // optional — shown in look modal
    estPriceRange: "$25 - $30",           // optional — defaults to "Contact archive for pricing"
    budgetAlternativeUrl: "https://...", // optional — defaults to forever21.com
    canvasImage: "/images/clothes/outfit-01/black-beanie-01.png",
    defaultCanvasPosition: {
      top: "2.34%",
      left: "17.96%",
      width: "20%",
      zIndex: 4,
    },
  },
),
```



### `ClothingItem` shape (runtime)

**Source:** `src/types/item.ts`


| Field                             | Required        | Notes                                   |
| --------------------------------- | --------------- | --------------------------------------- |
| `id`, `name`, `category`, `brand` | yes             | Core identity                           |
| `shopUrl`                         | yes (defaulted) | Original purchase link in look modal    |
| `estPriceRange`                   | yes (defaulted) | Shown when look metadata is unlocked    |
| `budgetAlternativeUrl`            | yes (defaulted) | Budget alternative link                 |
| `displayModel`                    | no              | Product title in modal                  |
| `canvasImage`                     | no              | PNG path for collage rendering          |
| `defaultCanvasPosition`           | no              | Fallback layout before look JSON exists |


**Valid** `ClothingCategory` **values:** `headwear`, `eyewear`, `tops`, `outerwear`, `bottoms`, `shoes`, `bags`, `waist`, `accessories`

Lookup: `getClothingItem(id)` from `src/data/items.ts`.

---



## 5. Two export paths



### Path A — Editorial lookbook look (SS26 curated looks)

Use when calibrating a **published look** on the homepage / look modal.

#### Artifacts to produce

**1. Canvas layout JSON**

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

Currently committed: `look-01` … `look-07`. The index file `src/data/canvas-layouts/index.ts` is auto-regenerated by the dev API.

**2. Clothing PNG cutouts**

**Path:** `public/images/clothes/{outfit-folder}/{item-id}.png`  
**URL:** `/images/clothes/{outfit-folder}/{item-id}.png`

**3. Item entries in** `src/data/items.ts`

Add one `defineItem(...)` block per garment (see section 4).

**4. Look definition in** `src/data/looks.ts`

```typescript
{
  id: "look-01",
  title: "Look 04 — Cyber Grunge",
  layout: "collage",
  outfitId: "outfit-01",           // folder slug under public/images/clothes/
  image: "/images/clothes/outfit-01/hero.WEBP",  // homepage card thumbnail
  modelName: "SEONGHYEON",
  editorGuideImage: "/images/clothes/outfit-01/combined.png",  // optional dev overlay
  width: 1700,
  height: 2500,
  vibe: "...",
  investmentRetail: 5,
  investmentWithGuide: 2,
  versatility: 5,
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

> **Important:** `coordinates.from` / `coordinates.to` are **legacy leader-line hotspot positions** for the look modal item list. They are **not** used for collage canvas placement. Collage placement comes exclusively from `look-XX.json` + `defaultCanvasPosition`.



#### Dev import API (localhost only)

```
POST /api/save-canvas-layout
Content-Type: application/json

{
  "lookId": "look-01",
  "layouts": { ...CanvasItemLayout map... }
}
```

Writes `src/data/canvas-layouts/look-01.json` and regenerates `index.ts`.  
**Source:** `src/app/api/save-canvas-layout/route.ts`

#### In-app editor ([localhost](http://localhost))

Open any unlocked look on the homepage → **Editor On** toggle → drag/resize items in `CollageStudioLayer`.  
Export snippet via `CoordinateEditorExport` or persist via the API above.

**Resize bounds in editor:** min **48 px**, max **720 px** width (`CollageStudioLayer.tsx`).

---



### Path B — User wardrobe outfit (builder + saved archive)

Use when a user composes an outfit in `/wardrobe` and saves it.

**Type:** `SavedWardrobeOutfitBlueprint` (`src/types/wardrobe-builder.ts`)

```typescript
{
  id: "uuid",
  name: "LOOK 01",
  moodword: "EDITORIAL",
  moodImageUrl: "data:image/jpeg;base64,..." | null,
  canvasBg: "#FFFFFF",
  savedAt: "2026-06-21T12:00:00.000Z",
  slots: WardrobeOutfitMatrix,           // exactly 9 entries
  layoutOverrides?: {                  // optional free-drag positions
    "item-id": { top: 15.2, left: 33.1 }  // numbers = percent (not strings)
  },
}
```

**Storage:** Supabase table `user_saved_outfits` (+ local fallback)  
**Source:** `src/lib/savedWardrobeOutfitDb.ts`

#### Wardrobe slot matrix (exactly 9 slots)


| Index | Label    | `categoryFilter` |
| ----- | -------- | ---------------- |
| 0     | eyewear  | EYEWEAR          |
| 1     | hat      | HAT              |
| 2     | acc_head | ACC_HEAD         |
| 3     | outer    | OUTER            |
| 4     | top      | TOP              |
| 5     | bag      | BAG              |
| 6     | shoes    | SHOES            |
| 7     | bottom   | BOTTOM           |
| 8     | waist    | WAIST            |


Each slot is `null` or:

```typescript
{
  id: "compression-shirt-01",
  categoryFilter: "TOP",
  slotIndex: 4,
  sourceLookId: "look-01",  // which look-XX.json supplies layout positions
}
```



#### How the wardrobe builder resolves positions

**Source:** `src/lib/wardrobeBuilderLook.ts`

1. For each equipped item, load layout from `resolveCanvasLayouts(sourceLookId, [item], 420)`
2. Fall back to item's `defaultCanvasPosition` if no committed layout entry exists
3. Apply matrix-category z-index stack
4. Merge `layoutOverrides` when user dragged items in free-drag mode

**Free-drag bounds:** `top` / `left` roughly **-50% to 120%**  
**Source:** `src/lib/wardrobeDragLayout.ts` — `DRAG_LAYOUT_PERCENT_MIN`, `DRAG_LAYOUT_PERCENT_MAX`

#### PNG export (saved outfits)

**Source:** `src/lib/exportLookCardPng.ts`

Renders the off-screen preview card (`WardrobeOutfitLivePreviewCard`) at **420 × 686** via `html2canvas-pro`, inlines remote images as data URLs to avoid taint, then downloads or native-shares the PNG.

---



## 6. Image asset requirements



### Clothing PNGs (flat-lay cutouts)

- **Path pattern:** `/images/clothes/{outfit-folder}/{item-id}.png`
- **On disk:** `public/images/clothes/outfit-01/black-beanie-01.png`
- **Format:** PNG with **transparent background**
- **Rendering:** `object-contain`; light canvases use `mix-blend-multiply` on the garment layer
- **No fixed source pixel size** — display height scales from `widthPx` preserving aspect ratio



### Editor guide image (optional, dev calibration)

- **Default path:** `/images/clothes/{outfit-folder}/combined.png`
- **Override per look:** `editorGuideImage` in `src/data/looks.ts`
- Shown as a placement reference in localhost edit mode only (`EditorGuideOverlay`)



### Mood image overlay (wardrobe look cards only)

- **Frame:** 120 × 160 px (3:4), positioned `top-4 right-4` on the canvas
- **Upload limits:** max 720 px longest edge, JPEG, ~400 KB when stored as data URL
- **Source:** `src/components/wardrobe/WardrobeMoodImageFrame.tsx`, `src/lib/compressMoodImage.ts`



### Canvas background colors

**Source:** `src/lib/wardrobeCanvasBackground.ts`


| Hex       | Label                 |
| --------- | --------------------- |
| `#FFFFFF` | Crisp White (default) |
| `#0D0D0D` | Jet Black             |
| `#E3EDF7` | Blueprint Ice         |
| `#F4F6F8` | Editorial Gray        |


---



## 7. Coordinate math



### Reference artboard: 420 × 630 px

**Pixel → export strings:**

```
left    = ((anchorX_px / 420) * 100).toFixed(2) + "%"
top     = ((anchorY_px / 630) * 100).toFixed(2) + "%"
widthPx = Math.round(displayWidth_px)
```

**Export strings → pixel (preview in your tool):**

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



## 8. Homepage gating (lookbook)

**Source:** `src/lib/launchGates.ts`, `src/data/looks.ts`


| Constant                       | Value | Meaning                            |
| ------------------------------ | ----- | ---------------------------------- |
| Homepage looks                 | all with `items.length > 0` | Shown on homepage grid |
| `FREE_TIER_SAVED_OUTFIT_LIMIT` | 3     | Max saved outfits per user         |


**Look stream order:** `HOMEPAGE_LOOK_ORDER` in `src/data/looks.ts` — currently looks 4–6 first (free), then 1–3 (premium), then 7–12.


| User action              | Behavior                                                   |
| ------------------------ | ---------------------------------------------------------- |
| Click any homepage look  | Opens `LookModal` with full collage + item metadata        |
| Item metadata in modal   | Shown for all public homepage looks (`isUnlockedArchiveLook`) |


Deep link: `/?look=look-01#lookbook-collection` opens the look modal directly (bypasses grid click handler).

---



## 9. Repo tooling


| Command / utility                                                                      | Purpose                                                                       |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `npm run item:draft -- --name "..." --url "..." --png "./path.png" --outfit outfit-04` | LLM-assisted item draft → paste snippet into `items.ts`                       |
| `npx tsx scripts/inline-items.mts`                                                     | Dev utility: reformat `items.ts` `defineItem` blocks (run after manual edits) |
| `POST /api/save-canvas-layout`                                                         | Save look layout JSON (localhost dev only)                                    |




### Item draft output

**Input** (`src/lib/itemDraft/types.ts`):

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

**Output:** `drafts/items/{id}.snippet.ts` — a ready-to-paste `defineItem(...)` block plus metadata fields.

**Generated canvas path:**

```
/images/clothes/{outfitFolder}/{id}.png
```

Default stub position: `top/left: 10%`, `width: 20%`, `zIndex: 4` — calibrate in localhost editor afterward.

---



## 10. Key source files


| File                                          | Purpose                                           |
| --------------------------------------------- | ------------------------------------------------- |
| `src/lib/lookCanvasReference.ts`              | Canvas dimensions (420×630), mobile scale helpers |
| `src/types/canvas-layout.ts`                  | `CanvasItemLayout` type                           |
| `src/data/canvas-layouts/*.json`              | Committed per-look layouts                        |
| `src/data/canvas-layouts/index.ts`            | Auto-generated layout index                       |
| `src/data/items.ts`                           | Master clothing catalog (`defineItem`)            |
| `src/data/looks.ts`                           | Lookbook look definitions + homepage order        |
| `src/types/wardrobe-builder.ts`               | Wardrobe slots, saved outfit blueprint            |
| `src/lib/canvasLayout.ts`                     | Layout resolution, hit-testing, nudge helpers     |
| `src/lib/canvasLayerStack.ts`                 | zIndex layer constants + category mapping         |
| `src/lib/wardrobeBuilderLook.ts`              | Wardrobe builder layout resolution                |
| `src/lib/wardrobeDragLayout.ts`               | Free-drag bounds + override merge                 |
| `src/lib/wardrobeCanvasBackground.ts`         | Allowed canvas background colors                  |
| `src/lib/savedWardrobeOutfitDb.ts`            | Supabase save/load for user outfits               |
| `src/lib/lookToWardrobeBlueprint.ts`          | Convert lookbook look → wardrobe matrix           |
| `src/lib/exportLookCardPng.ts`                | PNG export via html2canvas-pro                    |
| `src/components/modal/CollageStudioLayer.tsx` | Localhost collage editor                          |
| `src/app/api/save-canvas-layout/route.ts`     | Dev API to write layout JSON                      |
| `src/lib/itemDraft/`                          | Item draft CLI pipeline                           |


---



## 11. Minimum viable export checklist



### New editorial lookbook look

- [ ] PNG cutouts in `public/images/clothes/outfit-XX/{item-id}.png`
- [ ] Layout JSON in `src/data/canvas-layouts/look-XX.json`
- [ ] One `defineItem(...)` per garment in `src/data/items.ts` with `canvasImage` + `defaultCanvasPosition`
- [ ] Look entry in `src/data/looks.ts` with `layout: "collage"`, `outfitId`, and `items[]` placements
- [ ] Add look id to `HOMEPAGE_LOOK_ORDER` if it should appear on the homepage
- [ ] Optional: `combined.png` or `editorGuideImage` for dev calibration



### User wardrobe outfit (runtime — not file export)

- [ ] Item IDs that exist in the catalog and user owns via wardrobe
- [ ] 9-slot matrix with equipped items + `sourceLookId` per item
- [ ] Optional `layoutOverrides` for custom drag positions (percent as **numbers**)
- [ ] Optional `moodImageUrl`, `moodword`, `canvasBg`, `name`

---



## 12. Rendering notes (visual parity)


| Context                       | Behavior                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| Light canvas                  | Garment layer uses CSS `mix-blend-multiply`                                    |
| Dark canvas (`#0D0D0D`)       | No multiply; white drop-shadow on PNG edges instead                            |
| Collage backdrop (look modal) | `#ffffff` (`COLLAGE_FLOOR_BACKDROP` in `src/lib/collageLayout.ts`)             |
| Look card footer              | Outfit name (left) + `build your own` / `cortisstyle.com` (right), 56 px strip |
| Mood overlay                  | z-index 10, above background, below garments                                   |


---



## 13. What you do NOT need to replicate

These were removed or are not part of the collage pipeline:

- **Style guide PDF generation** — removed entirely
- `guidePrice`**, Shopier checkout, purchase-intent API** — removed
- `blurredDescription` **/** `unlockedDescription` — removed from item catalog
- `item-metadata.ts` — merged into `items.ts`
- **Leader-line hotspot editor** (`LookHotspotLayer`) — replaced by `CollageStudioLayer`
- **Hitbox fields** — optional unless you need pixel-perfect click targets in the in-app editor
- `coordinates` **in** `looks.ts` — legacy modal UI only, not collage placement

---



## 14. Example: minimal new look package

```
public/images/clothes/outfit-07/
  jacket-01.png
  skirt-01.png
  boots-01.png
  combined.png          (optional dev guide)

src/data/canvas-layouts/look-07.json
src/data/items.ts       (3 defineItem blocks)
src/data/looks.ts       (1 look entry, layout: "collage")
```

**look-07.json:**

```json
{
  "jacket-01": { "top": "8%", "left": "25%", "widthPx": 180, "zIndex": 25 },
  "skirt-01":  { "top": "42%", "left": "30%", "widthPx": 160, "zIndex": 20 },
  "boots-01":  { "top": "68%", "left": "10%", "widthPx": 200, "zIndex": 30 }
}
```

**items.ts snippet:**

```typescript
defineItem("jacket-01", "JACKET", "outerwear", "Brand", {
  shopUrl: "https://example.com/jacket",
  displayModel: "Raw Denim Jacket",
  estPriceRange: "$160 - $180",
  budgetAlternativeUrl: "https://www.asos.com/",
  canvasImage: "/images/clothes/outfit-07/jacket-01.png",
  defaultCanvasPosition: { top: "8%", left: "25%", width: "43%", zIndex: 25 },
}),
```

---

*Last updated to match the SS26 codebase: unified* `items.ts`*, wardrobe builder, PNG export, premium look gating, no PDF/commerce layer.*