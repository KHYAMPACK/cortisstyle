# Codebase Cleanup Audit — Cortisstyle

Internal review of **unused code**, **dormant pre-launch systems**, **duplication**, and **optimization** opportunities. No code was changed — this doc is the action list.

**Review date:** July 2026  
**Production default** (per `localdevseeds`): all launch gates **off**. Site runs full lookbook, open auth, and `/wardrobe` without middleware redirects.

---

## Executive summary

| Area | Verdict |
| ---- | ------- |
| **Email capture / funnel** | Built and wired, but **not in any live user flow** while gates are off. Only reachable via direct URLs (`/notify`, `/wardrobe-coming-soon`, `/checkout-coming-soon`). |
| **Premium look paywall** | UI + modal exist, but **never triggers** — `HOMEPAGE_FREE_LOOK_COUNT === HOMEPAGE_PUBLIC_LOOK_COUNT` (8). |
| **Launch gate system** | Still useful for future deploys, but adds **~15 files** if you no longer need pre-launch waitlists. |
| **Main app (`src/`)** | No fully orphan React components found — cleanup is mostly **systems**, not random dead UI. |
| **Highest-impact deletes** | `api/wardrobe-notify`, `uuid` npm package, checkout-coming-soon funnel (if commerce not planned soon). |

---

## 1. Email capture & funnel notify

### How it works today

```
FunnelEmailCapture.tsx
  → POST /api/funnel-notify
  → funnelNotifyDb.insertFunnelNotifySignup()
  → Supabase: wardrobe_notify_signups | member_notify_signups
```

### UI entry points

| Component | Page | `source` | DB table | Reachable in production? |
| --------- | ---- | -------- | -------- | ------------------------ |
| `NotifyDeployGate` | `/notify` | `member-notify` | `member_notify_signups` | **Only** if `NEXT_PUBLIC_AUTH_GATE_ENABLED=true` **or** user types URL |
| `ComingSoonGate` | `/wardrobe-coming-soon` | `wardrobe-coming-soon` | `wardrobe_notify_signups` | **Only** if `NEXT_PUBLIC_WARDROBE_GATE_ENABLED=true` **or** direct URL |
| `CheckoutComingSoonGate` | `/checkout-coming-soon` | `checkout-priority` | `member_notify_signups` | **Never linked** from nav — direct URL only |

**Your instinct is correct:** with gates off, **no normal user path hits email capture**. Auth uses `AuthPopup` (real accounts), not `FunnelEmailCapture`.

### Dead / unreachable funnel pieces

| Item | Evidence | Recommended action | Priority |
| ---- | -------- | ------------------ | -------- |
| `src/app/api/wardrobe-notify/route.ts` | Zero callers. `FunnelEmailCapture` always uses `/api/funnel-notify`. Duplicate of funnel route with hardcoded `wardrobe-coming-soon` source. | **Delete** route file | **High** |
| `src/app/checkout-coming-soon/page.tsx` + `CheckoutComingSoonGate.tsx` | No `href`, `router.push`, or redirect to `/checkout-coming-soon` anywhere. `CHECKOUT_COMING_SOON_PATH` only used in `isDarkGatePath()` for header theming. | **Delete** page + component **or** keep until commerce layer exists | **High** |
| Funnel source `archive-extension` | Default fallback in `funnel-notify/route.ts` when `source` omitted. **No UI** passes this source. | Remove from `VALID_SOURCES`, types, and API default | **Medium** |
| Funnel source `premium-inner-circle` | In API + `funnelNotifyDb.ts` only. `PremiumArchivePaywallModal` opens `AuthPopup`, not email capture. | Remove **or** wire paywall to `FunnelEmailCapture` if subscription waitlist returns | **Medium** |
| `ComingSoonGate` query param `?status=free-tier-limit` | `isArchiveLimitStatus()` branch exists. **No link** in codebase sets this param. Limit UX lives in `SavedOutfitArchiveLimitModal` inside wardrobe. | Remove dead branch from `ComingSoonGate` | **Low** |

### Decision: keep vs remove entire funnel system

**Option A — Delete funnel (recommended if launch is done)**  
Remove email capture UI, `/api/funnel-notify`, funnel DB helpers, gate pages (`/notify`, `/wardrobe-coming-soon`, `/checkout-coming-soon`), related env vars, and Supabase notify tables (after exporting any emails you care about).

**Files to remove (Option A):**

- `src/components/FunnelEmailCapture.tsx`
- `src/components/NotifyDeployGate.tsx`
- `src/components/ComingSoonGate.tsx`
- `src/components/CheckoutComingSoonGate.tsx`
- `src/app/notify/page.tsx`
- `src/app/wardrobe-coming-soon/page.tsx`
- `src/app/checkout-coming-soon/page.tsx`
- `src/app/api/funnel-notify/route.ts`
- `src/app/api/wardrobe-notify/route.ts`
- `src/lib/funnelNotifyDb.ts`
- `supabase/patch_member_notify.sql` / `patch_wardrobe_notify.sql` — keep as history or drop tables in Supabase dashboard

Also simplify:

- `src/lib/launchGates.ts` — remove `CHECKOUT_COMING_SOON_PATH`, `NOTIFY_DEPLOY_PATH`, `getNotifyDeployPath()`, `isAuthGateEnabled()` if auth gate retired
- `src/lib/wardrobeGate.ts` — remove gate flag if wardrobe is permanently open
- `src/middleware.ts` — remove wardrobe redirect block
- `localdevseeds` — remove commented gate vars + dead `NEXT_PUBLIC_PURCHASE_GATE_ENABLED`

**Option B — Keep funnel as ops toolkit**  
Keep files but document that they are **opt-in via env**. Remove only clear dead pieces (`wardrobe-notify` route, checkout page if unused, dead funnel sources).

---

## 2. Launch gates & pre-launch infrastructure

### Env flags

| Env var | Read in code? | Effect when `true` | Default |
| ------- | ------------- | ------------------ | ------- |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Yes — `middleware.ts` | Redirect all routes → `/maintenance` | Off |
| `NEXT_PUBLIC_WARDROBE_GATE_ENABLED` | Yes — `middleware.ts` | Redirect `/wardrobe` → `/wardrobe-coming-soon` | Off |
| `NEXT_PUBLIC_AUTH_GATE_ENABLED` | Yes — `ProfileButton` only | Unauthenticated profile click → `/notify` | Off |
| `NEXT_PUBLIC_PURCHASE_GATE_ENABLED` | **No** — not referenced in TS/TSX | Nothing | Dead env var in `localdevseeds` |

### Gate pages inventory

| Path | Component | Still needed? |
| ---- | --------- | ------------- |
| `/maintenance` | `MaintenanceGate` | **Yes** — useful for deploys |
| `/wardrobe-coming-soon` | `ComingSoonGate` | Only if wardrobe gate kept |
| `/notify` | `NotifyDeployGate` | Only if auth gate kept |
| `/checkout-coming-soon` | `CheckoutComingSoonGate` | **No inbound links** — delete or defer |
| `/onboarding` | Redirect-only page | Legacy bookmarks only — delete or `next.config` redirect |

### Inconsistencies to fix (if keeping gates)

| Issue | Location | Fix |
| ----- | -------- | --- |
| Wardrobe button ignores gate | `EnterDigitalWardrobeButton.tsx` hardcodes `WARDROBE_APP_PATH` | Use `getWardrobeEntryPath()` like `NavMenuDrawer.tsx` |
| Auth gate only on profile | `ProfileButton.tsx` redirects to `/notify`; `EnterDigitalWardrobeButton`, `LookModal`, `wardrobe/page.tsx`, `PremiumArchivePaywallModal` still open `AuthPopup` with signup | Either remove auth gate entirely **or** centralize `openAuthOrNotify()` helper used everywhere |
| `allowSignUp={false}` never used | `AuthPopup.tsx` L614–621 — “Get notified when accounts open” branch | Dead branch unless auth gate returns |

---

## 3. Premium paywall (dormant)

### Current constants (`src/lib/launchGates.ts`)

```ts
HOMEPAGE_PUBLIC_LOOK_COUNT = 8
HOMEPAGE_FREE_LOOK_COUNT = 8  // same → no locked looks
```

### Still wired but inactive

| Piece | Role |
| ----- | ---- |
| `LookGrid` + `LookCard` | `isLockedLook` / “Premium Access” overlay |
| `HomePageClient` | `PremiumArchivePaywallModal` via `onLockedLookClick` |
| `isUnlockedArchiveLook()` | Hides item metadata / shop links for “locked” looks |

With current constants, **indices 0–7 are all unlocked** — paywall modal never opens from grid clicks.

### Recommended action (pick one)

**A. Affiliate-first (matches current strategy)**  
- Keep all 8 looks unlocked (or raise public count when adding looks)  
- **Remove** `PremiumArchivePaywallModal`, locked `LookCard` UI, and simplify `isUnlockedArchiveLook` to always true for public looks  
- **Keep** `FREE_TIER_SAVED_OUTFIT_LIMIT` + `SavedOutfitArchiveLimitModal` if you still want wardrobe upsell later  

**B. Subscription later**  
- Lower `HOMEPAGE_FREE_LOOK_COUNT` (e.g. to 6) when membership launches  
- Keep paywall modal; optionally connect to Stripe instead of “en route” copy  

**C. Status quo**  
- Harmless dead UI — low priority delete, but adds cognitive load for future you  

---

## 4. Unused npm dependencies

| Package | Used? | Action | Priority |
| ------- | ----- | ------ | -------- |
| **`uuid`** + **`@types/uuid`** | **Zero imports** in `.ts`/`.tsx`/`.mts` | **Remove** from `package.json` | **High** |
| `fabric` | Studio only (`useFabricArtboard`, `fabricArtboardBridge`) | Keep; consider moving to `studio/package.json` if you split packages later | Low |
| `busboy` + `@types/busboy` | Studio dev server handlers only (`studio/server/api/*`) | Keep for `dev:studio`; optional move to `devDependencies` | Low |
| `zustand`, `fflate`, `html2canvas-pro`, `sharp`, `framer-motion`, etc. | Active | Keep | — |

After removing `uuid`:

```bash
npm uninstall uuid @types/uuid
```

---

## 5. API routes audit

| Route | Callers | Status | Action |
| ----- | ------- | ------ | ------ |
| `POST /api/funnel-notify` | `FunnelEmailCapture` | Active only if funnel pages used | Delete with Option A above |
| `POST /api/wardrobe-notify` | **None** | Dead | **Delete** |
| `POST /api/auth/check-email` | `authEmailCheck.ts` → `AuthContext` | Active | Keep |
| `POST /api/save-canvas-layout` | `CoordinateEditorExport` (localhost dev editor) | Dev-only | Keep; document in README |
| `POST /api/studio/*` (10 routes) | Studio SPA + `/auth/studio` | Active | Keep |

Studio Vite dev (`npm run dev:studio`) also serves `/api/remove-bg` and `/api/analyze-garment` via `studio/server/vitePlugin.ts` — mirrors production Next routes for local work.

---

## 6. Data & content cleanup

### Placeholder looks (`src/data/looks.ts`)

| Look | On homepage? | Items | Notes |
| ---- | ------------- | ----- | ----- |
| `look-01` … `look-07` | Yes (first 7 in stream order) | Populated | Active |
| `look-08` | Yes (8th slot) | **Empty `items: []`** | Shows on grid but modal has no shop links |
| `look-09` … `look-12` | **No** — `HOMEPAGE_PUBLIC_LOOK_COUNT = 8` | **Empty** | In `HOMEPAGE_LOOK_ORDER` but not shown |

**Actions:**

- Finish `look-08` items **or** remove from public count until ready  
- Delete `look-09`–`look-12` placeholders **or** finish + bump `HOMEPAGE_PUBLIC_LOOK_COUNT`  
- Remove temp hero images under `public/images/temp_image_*` if looks are deleted  

### Orphan studio data

| File | Evidence | Action |
| ---- | -------- | ------ |
| `studio/src/data/canvas-layouts/look-01.json` | Never imported in studio or src | **Delete** |

### Active data (do not delete)

- `src/data/dynamic-looks/outfit-010efe85.json` + `-items.json` — loaded via `buildCatalogFromDisk()` in `layout.tsx`
- `src/data/canvas-layouts/look-01.json` … `look-07.json` — used by collage layout resolver
- `src/data/items.ts` — large but **active** catalog (~950+ lines)

### Docs drift

| Doc | Issue | Action |
| --- | ----- | ------ |
| `docs/cortisstyle-collage-integration-spec.md` | Lists `HOMEPAGE_PUBLIC_LOOK_COUNT = 7`, `HOMEPAGE_FREE_LOOK_COUNT = 6` | Update to match `launchGates.ts` (8/8) |
| `docs/legal-and-affiliate-compliance.md` | Placeholder table still present | Mark as filled — values live in `src/lib/siteLegal.ts` |

---

## 7. Duplicate code: `studio/` vs `src/`

Intentionally mirrored (comments say “Mirrors cortisstyle”). Not safe to delete one side without breaking Studio.

| `src/` | `studio/` | Notes | Consolidation |
| ------ | --------- | ----- | --------------- |
| `lib/lookCanvasReference.ts` | `studio/src/lib/lookCanvasReference.ts` | Studio adds export dimensions | Shared `packages/canvas-core` later |
| `lib/matrixBlueprintLayout.ts` | `studio/src/lib/matrixBlueprintLayout.ts` | Label constant names differ | Merge shared constants |
| `lib/canvasLayerStack.ts` | `studio/src/lib/canvasLayerStack.ts` | **Diverged** implementations | Document why; unify if possible |
| `lib/supabaseCookieStorage.ts` | `studio/src/lib/supabaseCookieStorage.ts` | Same pattern | Extract shared module |
| `lib/supabaseClient.ts` | `studio/src/lib/supabaseClient.ts` | Parallel clients | Extract shared module |
| `components/modal/MatrixBlueprintGrid.tsx` | `studio/src/components/workspace/MatrixBlueprintGrid.tsx` | Same grid, different paths | Low priority |

**Priority:** Low until Studio stabilizes. Biggest win is shared constants for canvas baseline (420×630), not full monorepo yet.

---

## 8. Auth flows — what’s active vs legacy

| Flow | Entry | Status |
| ---- | ----- | ------ |
| Email/password + OTP signup | `AuthPopup` | **Active** — main auth |
| Magic link / PKCE | `/auth/callback` | **Active** |
| Password reset | `/auth/reset-password` | **Active** |
| Studio curator gate | `/auth/studio` + `/api/studio/session` | **Active** |
| Email existence check | `/api/auth/check-email` | **Active** |
| Auth redirect bridge | `AuthRedirectBridge` in `Providers` | **Active** — handles tokens-in-URL → wardrobe |
| Onboarding redirect | `/onboarding` | **Legacy URL** — redirect only, no inbound links |
| Notify deploy gate | `/notify` | **Dormant** (gate off) |

### Duplicate studio access denied UI

- `src/components/StudioAccessDenied.tsx` — used by `/auth/studio`
- `studio/src/components/auth/StudioAuthGate.tsx` — inline `StudioAccessDeniedScreen`

Not duplicates across apps — each app has its own. OK to keep.

---

## 9. Dev-only / localhost features (keep, don’t delete)

| Feature | Location | Purpose |
| ------- | -------- | ------- |
| Collage coordinate editor | `LookModal` — “Editor On” when `isLocalhostClient()` | Dev layout tuning |
| `CoordinateEditorExport` | `LookItemsPanel` when edit mode | Export layout JSON snippet |
| `POST /api/save-canvas-layout` | localhost only | Persist layout to disk |
| `npm run item:draft` | `scripts/generate-item-draft.mts` | LLM item pipeline CLI |
| `npm run favicon:generate` | `scripts/generate-favicon.mts` | Asset generation |
| `scripts/inline-items.mts` | Not in `package.json` | Dev formatter for `items.ts` — add script or delete |

---

## 10. Optimization opportunities (not deletions)

| Area | Suggestion | Impact |
| ---- | ---------- | ------ |
| **`html2canvas-pro`** | Dynamic `import()` inside `exportLookCardAsPng` — only loads when user exports PNG from wardrobe | Smaller initial JS bundle |
| **`items.ts` size** | Long-term: split by outfit folder or move catalog to JSON/DB; short-term OK | Build + editor perf |
| **Intro loader** | Runs on every page except maintenance/auth callback — consider skipping on repeat visits (sessionStorage) | Perceived speed |
| **Vercel Analytics** | Gate behind cookie consent accept (see legal audit) | GDPR alignment |
| **`framer-motion`** | Heavy; used widely — don’t remove, but avoid adding to new static pages | Bundle size |
| **`fabric`** | Studio-only — already excluded from Next bundle if not imported in `src/` | OK today |

---

## 11. Recommended cleanup phases

### Phase 1 — Safe, high impact (1–2 hours)

1. Delete `src/app/api/wardrobe-notify/route.ts`
2. Run `npm uninstall uuid @types/uuid`
3. Remove `NEXT_PUBLIC_PURCHASE_GATE_ENABLED` from `localdevseeds`
4. Delete `studio/src/data/canvas-layouts/look-01.json`
5. Update `docs/cortisstyle-collage-integration-spec.md` gate constants (7/6 → 8/8)

### Phase 2 — Funnel decision (2–4 hours)

**If launch is done (recommended):**

1. Delete checkout-coming-soon page + component
2. Delete or archive `/notify` + `/wardrobe-coming-soon` + funnel API + `FunnelEmailCapture`
3. Remove auth/wardrobe gate env vars and middleware blocks (keep maintenance)
4. Fix `EnterDigitalWardrobeButton` to use `getWardrobeEntryPath()` if any gate remains

**If keeping funnel for next deploy:**

1. Delete only dead pieces (wardrobe-notify, checkout, dead sources)
2. Add comment block in `launchGates.ts` documenting how to re-enable

### Phase 3 — Product alignment (half day)

1. **Premium paywall:** delete dormant UI **or** lower `HOMEPAGE_FREE_LOOK_COUNT` when subscription returns
2. **Placeholder looks:** finish `look-08` or hide; delete or complete `look-09`–`look-12`
3. **Onboarding:** delete `/onboarding` or add permanent redirect in `next.config.ts`

### Phase 4 — Polish (when bandwidth allows)

1. Remove `ComingSoonGate` archive-limit query branch
2. Remove `AuthPopup` `allowSignUp={false}` dead branch (or wire auth gate properly)
3. Plan shared canvas constants package for studio/src
4. Dynamic import for `html2canvas-pro`
5. Update `docs/legal-and-affiliate-compliance.md` — note `siteLegal.ts` is source of truth

---

## 12. Do NOT delete (still in active use)

- `AuthPopup`, `AuthContext`, Supabase auth stack
- `WardrobeBuilderCanvas`, saved outfit DB layer
- `LookModal`, collage system, `CollageStudioLayer` (incl. localhost editor)
- `PremiumArchivePaywallModal` — **only if** you plan subscription; otherwise safe to remove
- `SavedOutfitArchiveLimitModal` — **active** when free tier saves > 3 outfits
- `SiteFooter`, legal pages, `CookieNotice`, `AffiliateShopDisclosure`
- All `/api/studio/*` routes and Studio SPA
- `DynamicCatalogProvider` + dynamic looks on disk
- `MaintenanceGate` + maintenance middleware
- `exportLookCardPng.ts` + wardrobe PNG export flow

---

## 13. Quick reference — file delete candidates

| Delete? | Path |
| ------- | ---- |
| ✅ Yes | `src/app/api/wardrobe-notify/route.ts` |
| ✅ Yes | `uuid`, `@types/uuid` in `package.json` |
| ✅ Yes | `studio/src/data/canvas-layouts/look-01.json` |
| ⚠️ If funnel retired | `src/components/FunnelEmailCapture.tsx` |
| ⚠️ If funnel retired | `src/components/NotifyDeployGate.tsx` |
| ⚠️ If funnel retired | `src/components/ComingSoonGate.tsx` |
| ⚠️ If funnel retired | `src/components/CheckoutComingSoonGate.tsx` |
| ⚠️ If funnel retired | `src/app/notify/page.tsx` |
| ⚠️ If funnel retired | `src/app/wardrobe-coming-soon/page.tsx` |
| ⚠️ If funnel retired | `src/app/checkout-coming-soon/page.tsx` |
| ⚠️ If funnel retired | `src/app/api/funnel-notify/route.ts` |
| ⚠️ If funnel retired | `src/lib/funnelNotifyDb.ts` |
| ⚠️ If affiliate-first, no sub | `PremiumArchivePaywallModal` + locked look UI in `LookCard` |
| ⚠️ Legacy | `src/app/onboarding/page.tsx` |
| ❌ No | Everything in “Do NOT delete” section above |

---

## Revision log

| Date | Change |
| ---- | ------ |
| July 2026 | Initial codebase cleanup audit |
