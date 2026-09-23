# Phase 1B Handoff — internal onboarding tooling

_Prepared 2026-09-23 for the `cortisstyle` repo, verified against the live repo and production Supabase schema (not just the roadmap text, which predates this session's Phase 1 work and has drifted in places — see findings below). Goal per `docs/platform-roadmap.md` §3b: Mert can create and launch a client store from one place, with defaults that are safe to go live with, taking "yes" → live from ~2 weeks to 1–2 days._

**Planning only — nothing in this doc has been built yet.**

## 0. What's already true (don't rebuild this)

This is the single biggest finding: most of what Phase 1B assumed still needed building already exists or already works automatically, as a direct side effect of Phase 1 (tenant config → DB) finishing:

- **Boutique creation is already a one-call, idempotent operation.** `POST /api/tr/admin/seed` (`src/app/api/tr/admin/seed/route.ts`) already upserts a `tr_boutiques` row from a JSON payload — create if the slug doesn't exist, update brand fields if it does, safe to re-run. It already accepts every brand/legal/contact field a new boutique needs (`legalName`, `vergiNo`, `physicalAddress`, `whatsappPhone`, `homeLayout`, `customDomain`, `catalogProfile`, etc.) plus optional starter products/orders/discount codes.
- **Legal pages need no separate "apply defaults" step.** `src/lib/tr/legal/docs.ts` renders all 8 Turkish legal doc types (kvkk, gizlilik, cerez, mesafeli-satış, ön-bilgilendirme, iade, üyelik, künye) generically from `TrLegalBoutiqueContext` — a shape built from the boutique's own DB fields at request time. There's no per-boutique legal content to seed; as soon as the seed payload's context fields are filled in, the legal pages just work.
- **Default payment mode is already "manual."** Since P1-T6 (this session, 2026-09-23), a boutique with no `tr_boutique_integrations` row simply doesn't offer iyzico checkout — `boutiqueOffersIyzicoCheckout()` returns `false`, checkout creates a pending order, owner marks it paid by hand. This *is* the safe default already; there's no explicit "set manual payment mode" flag to apply during onboarding.
- **Default contact email is already sensible.** `resolveBoutiqueContactEmail()` (`src/lib/tr/commerce/checkoutMode.ts`) falls back DB `contact_email` → `info@{customDomain}` → platform default, with zero onboarding action required.
- **Google Merchant feed already works per-boutique**, generically, at `/tr/[slug]/feeds/google-merchant.xml` — nothing to build for that part of a go-live check.

What's left is narrower than the original roadmap text: owner linking (no invite flow), a real go-live readiness check (doesn't exist — the current `boutique-health` route checks something different), and a decision about bulk product import that the roadmap itself already flagged as risky to over-build.

## 1. P1B-T1 — "Create store" tool: two real designs, pick one

The roadmap text says "an admin-only page or script." These aren't equivalent effort, and the repo already has working examples of both patterns — this is a real decision, not a detail.

**Option A — CLI script** (matches `scripts/link-tr-boutique-owner.mts`, `scripts/migrate-lilabutik-iyzico-credentials.mts`): a `tsx` script that takes a JSON intake file (or flags), calls the existing `/api/tr/admin/seed` logic directly (or the underlying `createBoutiqueAdmin`/`updateBoutiqueBrandAdmin` functions), and prints a plain-text summary. Fast to build (most of the logic already exists in the seed route — this is largely a thin wrapper plus the missing pieces below). Auth is free — it's a local script Mert runs, no new auth needed.

**Option B — Browser admin page**, e.g. `/tr/panel/admin/yeni-magaza`, gated by `isTrPanelStaffEmail()` (`src/lib/tr/panel/ownerAuth.ts` — this session-based staff-access mechanism already exists and already grants Mert cross-tenant visibility in `/tr/panel`; it's currently only used for viewing, not for a creation form). Nicer UX (a real form instead of hand-writing JSON), reuses existing session auth cleanly, but is more UI work to build.

**Recommendation:** start with Option A. It reuses far more existing code, has zero new auth surface, and the roadmap's own accept criteria ("no code edits" for onboarding a boutique) is satisfied either way — a script is not a code edit, it's a tool invocation. Option B is a reasonable follow-up once the script version proves out the actual field list needed, but building a form UI before knowing the final field list is premature.

**What the tool still needs that `/api/tr/admin/seed` doesn't do today:**
- **Owner linking has no invite mechanism.** Today: owner must sign up first (`/giris` or panel AuthPopup), *then* `PATCH /api/tr/admin/boutiques/[id]/owner` links them — there's no "send this person a signup link" email. Given Track A's own model (Mert sells in person, talks to the client directly), the pragmatic default is to keep this manual: Mert tells the client to sign up, then runs the link step (already scripted at `scripts/link-tr-boutique-owner.mts`). Building automated invite emails is real new infra (a template, a token, an expiry) for a flow that happens maybe once per client — **recommend deferring this**, not building it in Phase 1B, unless the time log shows it's actually a bottleneck.
- **Idempotent status handling already exists** (`existing ? update : create`, with a status-flip fix-up) — reuse as-is.

## 2. P1B-T2 — Client intake template

Genuinely new, but small: a Markdown checklist + a JSON shape that maps 1:1 onto the `SeedBoutiquePayload` interface already defined in the seed route (brand name, logo, colors, legal name, vergi no, IBAN, contact info, addresses, policies, first products). One confirmed gap: `SeedBoutiquePayload` doesn't currently expose `iban` as a field, even though `createBoutiqueAdmin`/`updateBoutiqueBrandAdmin` already fully accept and store it (`src/lib/tr/catalog/boutiques.ts:37,230,287-288` — the DB column and the library-level plumbing both already exist). This is a one-line addition to the route's interface and its two constructor calls, not new plumbing.

Recommend this lives as `docs/tr-boutique-intake-template.md` (a fillable checklist, mirroring the existing `docs/tr-boutique-legal-templates.md` convention) plus a JSON schema or TypeScript type the create-store tool imports directly, so the checklist and the tool can't drift apart from each other over time.

## 3. P1B-T3 — Bulk product import: recommend deferring, not building

Investigated the existing batch flow (`src/app/tr/panel/urun/toplu`, `src/lib/tr/productBatchCreateFlow.ts`) — it has **zero CSV/spreadsheet capability today**. More importantly, it's deeply coupled to the AI garment pipeline (photo upload → AI chip identification → AI packshot/try-on → listing draft — see `docs/agent-handoffs/08-ai-catalog-pipeline.md`). "Extending" it to accept a CSV isn't a small addition; a text-only bulk import is a fundamentally different, much simpler flow (title/price/sizes/stock/category/image-URLs, no AI steps at all) that would need to be built essentially from scratch alongside the existing tool, not grafted onto it.

The roadmap's own text already hedges on this ("Product entry is a likely time sink; measure first using the time log before over-building") — that caution is more warranted than it looked before this investigation, given how much net-new work a real CSV path would actually be. **Recommend: build nothing for T3 in this phase.** Onboard the next 1–2 clients using the existing AI batch flow, log actual time spent on product entry in the time log (see §5), and only build a bulk-import path if that log shows it's the real bottleneck — and if so, design it as its own lightweight flow, not an extension of the AI batch UI.

## 4. P1B-T4 — Go-live check: needs new work, not an extension

The roadmap text says "extend `/api/tr/admin/boutique-health`" — investigated that route and it checks something different: Supabase/RLS *infrastructure* health (anon vs. service-role query probes, whether the public view resolves, whether a hardcoded `lilabutik` products query succeeds). It's a debugging tool for "why is the storefront 404ing," not a per-boutique readiness checklist. Reusing its name/shape would conflate two different concerns.

**Recommend a new endpoint**, e.g. `GET /api/tr/admin/boutiques/[id]/go-live-check`, that reports the actual per-boutique dimensions the roadmap wants: has ≥1 product, storefront renders (a real fetch, not just a DB check), contact email resolves to something real, legal-page context fields are populated (name/address/vergiNo present — not empty defaults), payment mode is at least *decided* (either an integrations row exists, or the owner has been told checkout will be manual-only), shipping mode decided, custom domain resolves if one is set, Google Merchant feed returns valid XML. Plain pass/fail list, same spirit as the existing health route's output shape.

## 5. P1B-T5 — Onboarding playbook + time log

`docs/agent-handoffs/03-multi-tenant-boutiques.md` (rewritten this session, 2026-09-23) already covers the onboarding checklist in the DB-first, no-code-changes framing the roadmap wants — it just doesn't yet reference the create-store tool or time log because neither existed when it was written. Once T1 lands, doc 03 needs a small update (point at the actual tool instead of raw `curl`/API calls), not a rewrite.

`docs/onboarding-time-log.md` doesn't exist yet — needs creating: a simple table (date, client, time from "yes" to live, notes on what was slow), so the ≤2-day target (milestone A2) has real data behind it instead of a guess.

## 6. Design decisions needed before coding (ask Mert, don't guess)

1. **CLI script vs. browser admin page for T1** — recommend script (§1), confirm before building.
2. **Defer T3 (bulk import) entirely this phase** — recommend yes (§3), confirm.
3. **Owner invite email: build now or keep manual** — recommend keep manual (§1), confirm.
4. **Go-live check as a new endpoint, not an extension of `boutique-health`** — recommend yes (§4), confirm the exact dimensions to check are the right ones.
5. Does the intake template (§2) need sign-off from Mert on the exact field list before the tool is built against it, or is the current `SeedBoutiquePayload` shape (plus the missing `iban` field) good enough to start from?

## 7. Order of work (each a separate PR/commit, if approved)

1. Add `iban` to `SeedBoutiquePayload` in `src/app/api/tr/admin/seed/route.ts` and pass it through the two `createBoutiqueAdmin`/`updateBoutiqueBrandAdmin` calls — confirmed one-line addition, the library functions already fully support it.
2. Client intake template (`docs/tr-boutique-intake-template.md` + shared type).
3. Create-store script, reusing the seed route's logic.
4. `docs/onboarding-time-log.md` (empty table, ready to fill in).
5. Go-live check endpoint.
6. Update `docs/agent-handoffs/03-multi-tenant-boutiques.md` to point at the new script instead of raw API calls.
7. Onboard one real or test boutique end-to-end using only the new tool + doc 03, log the time, confirm the go-live check passes before calling it done.

## 8. Acceptance check for the whole phase

Matches the roadmap's own P1B accept criteria: Mert onboards a boutique end-to-end using only the tool and the updated playbook, in under one working day, with no code edits, and the go-live check passes.
