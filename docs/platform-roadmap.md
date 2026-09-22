# Cortisstyle Platform Roadmap — from "agency-built shops" to self-serve store platform

_Written 2026-09-21, revised the same day to make **Track A (fast client onboarding)** the main track. Owner: Mert (Ekiz Yazılım). Audience: coding agents and Mert. Supersedes the earlier assumption-based `claude/05-roadmap.md` in the Claude project._

## 1. Goal

Turn Cortisstyle from a white-label shop builder that Mert sets up by hand for each client into a **self-serve platform in the ikas / ideasoft category**: a Turkish seller signs up, gets a store, connects payments and shipping, picks a theme, attaches a domain, and pays a plan fee — without Mert touching code, env vars, or the database.

Mert now has a registered company, which removes the earlier legal blocker to self-serve onboarding. Two boutiques are already live and paying, so the target is a legitimate product, not a demo.

**Current strategy (decided 2026-09-21).** Mert works alone and sells in person: he talks to a boutique, they agree, and he builds their store. That model continues. Both existing clients were sold and launched this way (from scratch in about two weeks each, one-time fee, no product existed when they said yes). The bottleneck is **setup time and mess per new client**, not client acquisition. So the main goal now is to cut time from "yes" to "store live" from ~2 weeks to **1–2 days**, and to make the system solid enough that each new client adds little work. Public self-serve signup, billing automation, and the marketplace are **deferred (Track B)** until the assisted flow is smooth. Mert will keep taking clients while this is built; no client is turned away because the system is messy.

**Scope of what the platform offers clients:** the storefront, payments, invoices, and shipping working reliably. Marketing/traffic is not part of the offer (see §5 for a light "launch kit" that protects retention without becoming a marketing service).

## 2. Where the project is today (audit, 2026-09-21)

Built and working: multi-tenant storefronts at `/tr/[boutiqueSlug]` and custom domains; owner panel (`/tr/panel/*`: products, stock, orders, discounts, customers, invoices, reports, settings); checkout with Turkish tax/consent fields; iyzico Checkout Form (live for one boutique, `lilabutik`); Basit Kargo shipping (live for `lilabutik`); AI catalog tools; Supabase schema as manual SQL patches in `supabase/patch_*.sql`. 54 pages, 44 API routes.

Not platform-ready (the work in this roadmap):

| Gap | Evidence in the repo |
|---|---|
| No self-serve signup | Boutiques are created via `/api/tr/admin/seed` (admin secret); `owner_user_id` linked by hand via `/api/tr/admin/boutiques/[id]/owner`. `/api/tr/owner/boutiques` has only GET. |
| Tenants hardcoded in code | `src/lib/tr/payments/registry.ts` (`IYZICO_CHECKOUT_SLUGS = new Set(["lilabutik"])`, buyer-protection token by slug); `src/lib/tr/customDomain.ts` (static domain→slug map plus env `TR_BOUTIQUE_DOMAINS`); `src/lib/tr/commerce/checkoutMode.ts` (`CONTACT_EMAIL_BY_SLUG`); `src/lib/tr/boutiqueHome/registry.ts` (`SLUG_OVERRIDES`); `src/lib/tr/storefrontTheme/registry.ts`; `src/lib/tr/aiModel/registry.ts`; `src/lib/tr/boutique/minimora/isMinimoraBoutique.ts` and `.../newtenant/isNewTenantBoutique.ts`; `src/lib/tr/boutiqueHome/editorialContent.ts` (~l.340); `src/components/tr/boutique/editorial/TrBoutiqueAtelierHomeSections.tsx` (~l.216); `src/app/api/tr/admin/boutique-health/route.ts`. |
| Per-tenant secrets in env vars | iyzico and Basit Kargo credentials are per-boutique env keys (see `docs/agent-handoffs/12-*.md`, `13-*.md`). |
| No theme system | Two layouts (`default`, `editorial`) plus one-off skins (`src/components/tr/boutique/minimora/*`, `.../newtenant/*`). |
| No billing/plans | Nothing for subscriptions or plan limits. `TrBoutique.commissionBps` exists as a field but no logic computes commission. |
| No refunds | `payment_status` has `refunded` but no iyzico refund flow exists. |
| Repo hygiene | ~198 uncommitted files, commit messages like "fas"/"asf", dead lookbook/funnel code listed in `docs/codebase-cleanup-audit.md`. |

## 3. Rules for every agent working on this roadmap

1. **Start here:** read `AGENTS.md` (Next.js 16 differs from older versions — check `node_modules/next/dist/docs/` before using framework APIs), then `docs/agent-handoffs/README.md`, `00-overview.md`, `14-tr-codemap.md`, then only the handoff doc for your area.
2. **Lila is live.** `lilabutik` takes real card payments and real shipments. No change may alter its checkout, payment, or shipping behaviour unless the task says so. Prefer **dual-read** migrations: read new DB config first, fall back to the legacy hardcoded value, remove the legacy path only in a later, separate task after Lila is verified.
3. **Money is integer kuruş.** Never floats. Never trust client-sent prices or shipping fees; the server re-prices (see `docs/agent-handoffs/05-commerce-rails.md`).
4. **Schema changes are additive SQL patch files** named `supabase/patch_<name>.sql` (`add column if not exists`, `create table if not exists`), referenced from the matching `docs/agent-handoffs/*.md`. **Never run a patch against the production Supabase project.** Write the file, state the manual apply steps, and let Mert apply it.
5. **RLS is real only for public tables.** Owner/order/invoice/discount routes run on the service role after an app-layer owner check. Any new tenant-scoped route must filter by the caller's authorized boutique.
6. **Secrets:** never commit `.env*`, keys, tokens, or credentials, and never log them. Anything stored per tenant is encrypted at rest.
7. **Small PRs, one task each,** with a real commit message describing the change. After structural changes, update the matching `docs/agent-handoffs/*.md` (per `.cursor/rules/document-structural-changes.mdc`).
8. **Turkish-first UI copy.** Route segments stay Turkish (`/urunler`, `/sepet`, `/panel`).
9. **Test what you touch:** run lint and typecheck; for checkout, payment, or signup work also exercise the flow in sandbox mode and describe exactly what you verified. Do not claim a payment flow works if you only compiled it.

## 3b. Tracks and priorities

**Track A — Fast onboarding (main track, do first).** Everything needed so Mert can take a boutique from "yes" to live in 1–2 days.

1. Phase 0 — clean base.
2. Phase 1 — tenant config moves from code to database.
3. Phase 1B (new, below) — internal store-creation tool, intake template, bulk product import, go-live checklist.
4. Phase 3, tasks P3-T1–T3 only — provider interface, connect-own-keys, manual payment options as the **default** for a new store.
5. Phase 4, tasks P4-T1 and P4-T3 — per-store shipping settings and manual tracking as the default.
6. Phase 5, option (a) only — 2–3 fixed themes with editable colors/fonts/logo/sections, applied by Mert through the admin tool (no owner-facing theme editor yet).
7. Phase 8, tasks P8-T1, P8-T2, P8-T4 — monitoring, tests for money paths and tenant isolation, backups.

**Track B — Self-serve and scale (deferred).** Public signup (Phase 2), refunds and iyzico marketplace mode (P3-T4, P3-T5), owner-facing theme editor (P5-T3), owner-facing domain management (Phase 6), plans and billing automation (Phase 7), and the rest of Phase 8. Start only after Track A milestone A2 is met and there is a reason (demand, or Mert's time is no longer the limit).

**Measure it.** Record **time-to-live** (hours from client "yes" to public store with a working checkout) for every onboarding in `docs/onboarding-time-log.md`. Target: ≤ 2 days by milestone A2. If a step takes more than half a day, that step is the next thing to automate.

### Phase 1B — Internal onboarding tooling (Track A, ~1–1.5 weeks, after Phase 1)

**Goal:** Mert can create and launch a client store from one place, with defaults that are safe to go live with.

- **P1B-T1 Internal "create store" tool.** An admin-only page or script (admin auth via `TR_ADMIN_SECRET` or a staff email, per existing patterns in `src/lib/tr/adminAuth.ts` / `panel/adminAuth.ts`) that, in one step: creates the boutique row, creates or links the owner account (invite email), applies the default theme, default legal pages (`src/lib/tr/legal/docs.ts`), default shipping settings and default manual payment mode, sets status. Idempotent (safe to re-run). Base it on the existing `/api/tr/admin/seed` route and `createBoutiqueAdmin`, but without sample orders/demo data. Replaces the manual `owner_user_id` step.
- **P1B-T2 Client intake template.** A single checklist/form (Markdown + JSON schema) of everything needed from a client: brand name, logo, colors, legal name, vergi no and office, IBAN, contact info, addresses, policies, first products. The create-store tool accepts this JSON directly.
- **P1B-T3 Bulk product import.** Inspect the existing `src/app/tr/panel/urun/toplu` batch flow and `src/lib/tr/productBatchCreateFlow.ts`; extend to CSV/spreadsheet import (title, price, sizes, stock, category, image URLs). Product entry is a likely time sink; **measure first** using the time log before over-building.
- **P1B-T4 Go-live check.** Extend `/api/tr/admin/boutique-health` (currently probes two hardcoded slugs) into a per-boutique check that reports: has products, storefront renders, contact email set, legal pages present, payment mode set, shipping mode set, domain resolves (if any), Google Merchant feed valid. Output a plain pass/fail list Mert can read before telling a client "you're live".
- **P1B-T5 Onboarding playbook rewrite.** Rewrite `docs/agent-handoffs/09-boutique-clone-playbook.md` and `13-boutique-wire-in-and-go-live.md` into one short step-by-step that matches the new tool, including the time log.
  _Accept:_ Mert onboards a test boutique end to end using only the tool and playbook, in under one working day, with no code edits, and the go-live check passes.

## 4. Phases

Estimates assume one agent-assisted developer at roughly 15–25 hours/week. Ranges are wide on purpose.

### Phase 0 — Clean base (2–4 days)

**Goal:** a repo where agents can work safely and history is readable.

- **P0-T1 Fix repo state.** Remove the stale `.git/index.lock` (empty file, Sep 20) if it still exists. Investigate the ~198 modified files with `git diff --stat`; many (`.gitkeep`, `.webmanifest`, `.cursor/rules/*`) look like line-ending noise (CRLF vs LF). Fix via `.gitattributes`/`core.autocrlf` rather than committing noise. Commit real changes in logical commits; do not commit `.tmp-chrome-analysis/`, `tmp/`, or `.tmp-*` scratch files (add to `.gitignore` or delete).
  _Accept:_ `git status` clean; `git log` shows meaningful messages from here on.
- **P0-T2 Remove dead systems.** Execute the "delete" items in `docs/codebase-cleanup-audit.md` that Mert approves (email funnel, `wardrobe-notify`, checkout-coming-soon, unused `uuid` dependency, archived lookbook remnants). Ask Mert before deleting anything the audit marks optional.
  _Accept:_ build passes, no route in the TR app removed.
- **P0-T3 Decide naming.** Confirm platform brand/domain (Cortisstyle vs Lookbook rebrand) before Phase 2 UI copy is written. _(Mert decision, not an agent task.)_

### Phase 1 — Tenant config moves from code to database (1–2 weeks) — highest priority

**Goal:** onboarding a store requires zero code changes or deploys.

- **P1-T1 Inventory and design.** List every hardcoded slug (start with the table in §2, then `grep -rIn` for each known slug). Write a short design note in `docs/` deciding what becomes a column on `tr_boutiques` and what becomes a new table. Get Mert's approval before implementing.
- **P1-T2 Encrypted integration credentials.** New table (suggested `tr_boutique_integrations`: `boutique_id`, `provider`, `mode` sandbox/live, `credentials_encrypted`, `status`, timestamps) readable only via service role. Encrypt with AES-256-GCM using a server-only key env var. Provide `getBoutiqueIntegration(boutiqueId, provider)` in `src/lib/tr/`. Dual-read: DB first, then legacy env keys.
- **P1-T3 Payment capability from DB.** Replace `IYZICO_CHECKOUT_SLUGS` and slug-keyed buyer-protection config in `src/lib/tr/payments/registry.ts` with per-boutique DB state (`boutiqueOffersIyzicoCheckout` reads the DB, falls back to legacy for `lilabutik`).
- **P1-T4 Contact email, domain map, layout/theme overrides from DB.** Move `CONTACT_EMAIL_BY_SLUG`, `customDomain.ts` static map, `SLUG_OVERRIDES` in `boutiqueHome/registry.ts`, and `storefrontTheme/registry.ts` overrides into boutique columns. **Design note required for domains:** `src/middleware.ts` runs on the edge, so per-request DB lookups need caching (options: Vercel Edge Config, a cached internal lookup route, or short-TTL memo). Mert approves the approach first.
- **P1-T5 One-off skins become data.** Remove `isMinimoraBoutique` / `isNewTenantBoutique` branching by expressing those boutiques through the theme mechanism (fully finished in Phase 5; here, just stop keying behaviour on slug where a config field will do).
- **P1-T6 Legacy removal.** After Lila is verified end to end in production on DB-driven config, delete the legacy fallbacks in a separate PR.
  _Accept for phase:_ a brand-new boutique row with DB config can offer iyzico checkout, custom contact email, and a domain with no code edits. Lila's checkout, payment callback, abandon flow, and shipping label creation behave exactly as before (verified in sandbox and by Mert on one real order).

### Phase 2 — Self-serve signup and store creation (1.5–2.5 weeks) — TRACK B (deferred)

**Goal:** a stranger can create a store without Mert. _Not needed for Track A: P1B-T1 covers store creation for Mert. Build this later, reusing P1B-T1's creation service._

- **P2-T1 Inspect what exists.** `src/app/onboarding` and `src/lib/tr/customerAuth.ts` exist; read them first and report what is reusable before building.
- **P2-T2 Public signup flow.** Route (Turkish, e.g. `/tr/baslayin`): account creation via Supabase Auth, then a store wizard collecting store name, slug (validated, unique, with a **reserved-slug list**: `panel`, `cart`, `checkout`, `shop`, `api`, `dev`, `yakinda`, `siparis-onay`, `admin`, etc.), seller type (individual / sole proprietor / company), legal name, vergi no and tax office or TCKN as applicable, IBAN, contact phone, shipping and return addresses.
- **P2-T3 Boutique creation service.** A single server function creating the `tr_boutiques` row (status `draft`), setting `owner_user_id` to the signed-in user, no admin secret involved. Reuse and generalize logic from `src/lib/tr/boutiques.ts` (`createBoutiqueAdmin`). Add rate limiting using `src/lib/tr/rateLimit.ts` / `rateLimitPolicies.ts`.
- **P2-T4 Agreements.** Table recording acceptance of platform terms and seller agreement (version, timestamp, IP, user id). Checkout is not required to change. Legal text itself comes from Mert (see §5).
- **P2-T5 Review and go-live.** Admin review queue (list of `draft`/`pending` stores with their submitted data) and a verify action that moves status to `verified`. Later an automatic path can replace it.
- **P2-T6 Setup checklist in the panel.** On `/tr/panel`, show progress: profile complete, first product, payment connected, shipping connected, domain (optional), theme chosen.
  _Accept:_ a new user completes signup on a preview deployment, lands in the panel with an owner-scoped empty store, adds a product, and the public storefront renders it once verified. Cannot see or affect any other tenant's data (test this explicitly).

### Phase 3 — Payments (2–3 weeks) — Track A: P3-T1–T3 only; the rest is Track B

**Goal:** stores can take real payments without Mert handling keys. Routes are additive; existing flows keep working.

- **P3-T1 Provider interface.** Put payments behind a provider interface in `src/lib/tr/payments/` with iyzico as the first implementation, so PayTR or others can be added later. The checkout route and callbacks call the interface, not iyzico directly.
- **P3-T2 Connect-your-own-keys (iyzico).** Panel settings page where an owner enters their own iyzico API and secret key. Validate with a harmless provider call before saving, store via P1-T2, support sandbox vs live mode. Never return stored secrets to the client.
- **P3-T3 Manual payment options.** Bank transfer (havale/EFT) and pay-on-delivery/WhatsApp as per-store options, using existing interim order flow as a base.
- **P3-T4 Refunds.** iyzico refund/cancel flow: owner triggers from the order detail page, `payment_status` moves to `refunded`, stock and shipment handling defined, all in sandbox first. This also closes the "shipping failed, order just cancels" gap noted in `05-commerce-rails.md`.
- **P3-T5 iyzico Marketplace mode (blocked on approval).** Only start once iyzico approves Mert's marketplace application (docs: https://docs.iyzico.com/en/products/marketplace). Scope: create sub-merchants via API (PERSONAL / PRIVATE COMPANY / LIMITED-or-JOINT-STOCK types; TCKN or vergi no, tax office, legal title, address, IBAN), store `subMerchantKey` per boutique, send it at checkout so commission is deducted automatically (use the existing `commissionBps` field), handle payout approvals. Behind a per-store feature flag so own-keys stores are unaffected. **Ask iyzico before building:** who bears chargeback/refund liability, settlement timing, fee schedule, and whether a store-builder (not only a single marketplace) qualifies.
  _Accept for T1–T4:_ a fresh store owner connects their own sandbox iyzico keys, a test order pays and marks `paid`, an abandoned redirect restores stock, a refund works, and Lila's live flow is unchanged.

### Phase 4 — Shipping (about 1 week) — Track A: P4-T1 and P4-T3; P4-T2 optional per client

- **P4-T1 Per-store shipping settings.** Replace the hardcoded fee rules in `quoteShipping.ts` (flat 120 TL for one item, free for 2+, "Midi Jean Elbise" exception) with per-store settings (flat fee, free-shipping threshold, disabled). Keep the server as the only source of the fee. Preserve Lila's current numbers as her stored config.
- **P4-T2 Connect Basit Kargo in the panel.** Same pattern as P3-T2 (encrypted token, validate, sandbox/live). Keep the provider registry in `src/lib/tr/shipping/registry.ts` generic.
- **P4-T3 Manual fallback.** For stores without a carrier integration: owner enters carrier name and tracking code, order moves to `shipped`, customer gets notified. This must be the default for new stores.

### Phase 5 — Themes and store customization (2–5 weeks; scope decision needed) — Track A: option (a) applied via admin tool; owner UI (P5-T3) is Track B

- **P5-T0 Scope decision (Mert):** (a) 2–3 fixed themes with editable colors, fonts, logo, and section toggles (~2 weeks), or (b) a section-based editor closer to ikas (~5+ weeks). Default to (a) and ship it before considering (b).
- **P5-T1 Theme registry from data.** Consolidate `boutiqueHome/registry.ts` and `storefrontTheme/registry.ts` into one theme model keyed by a `theme_id` and `theme_settings` (jsonb) on the boutique, rendered by shared components. Move current `editorialContent` into this structure.
- **P5-T2 Migrate one-offs.** Express Minimora and NewTenant as theme configuration, or retire their bespoke component folders if they are demos. Check with Mert which are client sites that must remain pixel-identical.
- **P5-T3 Theme settings UI** in `/tr/panel/ayarlar`: pick theme, set brand color and fonts, upload logo and hero, edit home sections, live preview.
  _Accept:_ a new store can change its look from the panel with no code; existing stores (Lila, Pervin) render identically before and after (screenshot comparison).

### Phase 6 — Custom domains from the panel (3–5 days) — Track B (Track A adds domains via the create-store tool/Vercel dashboard)

- **P6-T1 Domain add/verify UI.** Owner enters a domain; server adds it to the Vercel project via the Vercel domains API, shows required DNS records, polls for verification, and stores status on the boutique. Needs a Vercel API token as a server-only env var.
- **P6-T2 Resolution.** Depends on the P1-T4 domain-lookup design. Confirm that the marketplace routes are never served on a tenant domain (existing rule).

### Phase 7 — Plans and billing (1.5–2 weeks) — Track B (Track A: invoice clients by hand)

- **P7-T0 Model decision (Mert):** monthly plans, commission, or both. With own-keys payments the platform cannot skim commission, so plans are the default; commission only applies in marketplace mode.
- **P7-T1 Plan data and limits.** Plan on each boutique with enforceable limits (product count, AI credits via existing `tr_ai_usage_events`, custom domain, staff seats). Admin can set a plan by hand first.
- **P7-T2 Billing.** Billing page in the panel and recurring charging. Investigate iyzico's subscription product; a manual invoice/bank-transfer month is an acceptable first version. Failed payment handling: grace period, then downgrade or suspend (`suspended` status already exists).
- **P7-T3 Invoicing.** Mert's company invoices stores for plan fees; confirm approach with the accountant (see §5).

### Phase 8 — Reliability, safety, support (1–2 weeks, ongoing) — Track A: P8-T1, P8-T2, P8-T4; rest Track B

- **P8-T1 Error monitoring** (e.g. Sentry) with tenant id on events; alerts on checkout, payment callback, and shipment failures.
- **P8-T2 Automated tests** for money paths and tenant isolation: checkout pricing, payment callback and abandon, refund, signup, and "owner A cannot read owner B". Add a test runner if none exists.
- **P8-T3 Admin console** for Mert: tenant list, status, plan, last order, suspend, impersonate-view (read-only).
- **P8-T4 Backups and runbooks:** Supabase backup/PITR confirmation, restore drill, incident notes.
- **P8-T5 Abuse controls:** rate limits on signup and auth, disposable-email and slug-squatting checks.

## 5. Non-code track (Mert, in parallel)

Not for agents to do; agents may draft documents for review.

- **Pricing for existing and new clients.** Past deals were a one-time fee (~4000 TL). Consider a lower setup fee plus a small monthly fee for hosting, support, and updates, invoiced by hand for now. Decide before the next client conversation.
- **Client scope and expectations.** The offer is the platform (store, payments, invoices, shipping). Marketing is out of scope, but a store that sells nothing tends to churn and never refers anyone, which hurts recurring revenue. State the boundary in the client agreement, and hand every client a light **launch kit**: a one-page checklist (link the store in the Instagram bio, WhatsApp order/support link, share product links, use the built-in Google Merchant feed at `/tr/[boutiqueSlug]/feeds/google-merchant.xml`, basic SEO titles), plus a check-in at 2 and 4 weeks after launch. This is small effort, not a marketing service.
- **Two existing clients are the regression suite.** Every change must leave both stores rendering and checking out the same way.

- **Apply to iyzico Marketplace now** via their Contact Us form: registered company, store-builder platform with a marketplace on top, existing sellers. The reply time is outside your control, so send it before any Phase 3 marketplace code.
- **Legal documents:** platform terms of use, seller agreement (with commission/plan terms), privacy policy and KVKK text, distance-sales/pre-information templates for stores (start from `docs/tr-boutique-legal-templates.md`, `docs/boutique-partnership-agreement-draft.md`). Have a lawyer review.
- **Accountant/lawyer questions:** whether the platform needs registration or a licence as an intermediary service provider (aracı hizmet sağlayıcı) and ETBİS obligations; how to invoice plan fees; GİB e-invoice (currently offline-only in `tr_invoices`).
- **Vercel and Supabase plan capacity** for many tenants and domains (check limits before Phase 6).

## 6. Milestones

| Milestone | Contents | Target |
|---|---|---|
| **A1 — Clean and DB-driven** | Phase 0, Phase 1 complete; Lila and the second client verified unchanged | ~2–3 weeks |
| **A2 — Fast onboarding** | Phase 1B; P3-T1–T3; P4-T1, P4-T3; fixed themes (P5 option a); P8-T1/T2/T4. Target: new client live in ≤ 2 days | ~5–7 weeks total |
| **B1 — Self-serve MVP** _(deferred)_ | Phase 2 public signup on top of P1B-T1's creation service, owner theme UI, owner domain UI | after A2, ~3–4 weeks |
| **B2 — Full v1** _(deferred)_ | Refunds, iyzico marketplace mode (if approved), plans and billing, rest of Phase 8 | ~3–5 months from start |
| **Later** | Cadde cross-boutique split checkout (needs marketplace mode, roughly 4–8 extra weeks), more payment providers | after B2 |

## 7. Dependencies (what blocks what)

- Phase 1 blocks Phases 1B, 2, 3, 4, 5, 6 (everything else needs config in the database).
- Phase 1B needs Phase 1; Phase 2 (Track B) reuses the Phase 1B creation service.
- Phase 2 needs P0 (clean repo) and legal text from §5 before real launch (not before building).
- P3-T5 needs iyzico approval and answers to the liability questions.
- Phase 6 needs the domain-lookup design from P1-T4.
- Phase 7 needs the model decision P7-T0.

## 8. Open decisions for Mert

1. Platform brand and domain (Cortisstyle vs Lookbook).
2. Theme scope: fixed themes (recommended) or a section editor.
3. Pricing model: plans only, or plans plus commission in marketplace mode.
4. Which existing one-off stores (Minimora, NewTenant, Ozeltablo, Pervin) must stay pixel-identical during migration.
5. Whether stores keep the `/tr/[slug]` path or move to platform subdomains (e.g. `slug.<platform-domain>`) as the default free address.
6. Time-to-live target and how to log it (proposed: ≤ 2 days from "yes" to live, logged in `docs/onboarding-time-log.md`).
7. Pricing structure for clients (setup fee plus monthly fee), decided before the next client conversation.
