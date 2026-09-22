# Phase 1 Handoff — tenant config moves from code to database

_Prepared 2026-09-22 for the `cortisstyle` repo. Verified against the live repo the same day (post Phase 0 cleanup, commit `675c39b`), and cross-checked against the actual production Supabase schema via the Supabase MCP connector (project `cortisstyle`, id `qjxclaggqzhfaqihwdle`) rather than just reading the SQL patch files, which can drift from what's deployed. Goal: onboarding a new boutique should never require a code change or a deploy. Read this alongside `docs/platform-roadmap.md` §3b and Phase 1 — this is the detailed breakdown of that phase._

**Confirmed via live schema read (read-only — no writes made to production):** `tr_boutiques` currently has exactly **4 rows**. So whatever isn't `lilabutik` is a handful of boutiques, not a large migration — reinforces that the "let everything except lilabutik break/change freely" framing in §2 is cheap to act on. Also confirmed: `contact_email` does not exist as a column yet (§6 is correctly a new addition), and `tr_boutique_integrations` does not exist as a table yet (§3 is correctly a new addition). No further live-schema surprises — everything else in this plan matched what the code and patch files suggested.

## 0. What's already true (don't rebuild this)

`tr_boutiques` already has real per-tenant columns for some of what looked hardcoded: `homeLayout` (`"default" | "editorial" | null`), `customDomain`, `themeAccent`, `editorialContent`, `catalogProfile`, `vergiNo`, `iban`, `commissionBps`, `ownerUserId`, `contactName`, `contactPhone`. So this phase is **not** "add a database" — it's "stop code from silently overriding or bypassing that database," plus add the few fields that genuinely don't exist yet (payment/shipping capability, credentials, contact email override).

## 1. The four confirmed hardcoded spots (verified today, exact locations)

### 1a. `src/lib/tr/payments/registry.ts` — payment capability and credentials
```ts
const IYZICO_CHECKOUT_SLUGS = new Set(["lilabutik"]);                    // line 39
const IYZICO_BUYER_PROTECTION_BY_SLUG: Record<string, TrIyzicoBuyerProtection> = { lilabutik: {...} };  // line 45
const CREDENTIAL_ENV_BY_SLUG: Record<string, {...}> = { lilabutik: {...} };  // line 56
```
Nothing in `tr_boutiques` currently stores "does this boutique offer iyzico checkout" or credentials. This is the piece that most needs a new table (§3).

### 1b. `src/lib/tr/customDomain.ts` — domain map
```ts
const DEFAULT_DOMAIN_MAP: Record<string, string> = { "pervinsoysal.com": "pervinsoysalbutik", ... };  // line 8
```
The comment in the file already says the right thing: *"Env JSON wins for Edge middleware; DB `custom_domain` is source of truth for admin/panel."* So there's already a plan here, just not finished — `customDomain` is a real DB column (confirmed above) but this hardcoded map is a **second, separate source of truth** that middleware actually uses at the edge, and it can drift from the DB column silently. That's the bug to fix, not "add a domain field."

### 1c. `src/lib/tr/commerce/checkoutMode.ts` — contact email override
```ts
const CONTACT_EMAIL_BY_SLUG: Partial<Record<string, string>> = { lilabutik: "...", minimora: "..." };  // line 24
```
No DB column for this at all. Smallest of the four — a genuinely new, optional field.

### 1d. `src/lib/tr/boutiqueHome/registry.ts` + `src/lib/tr/storefrontTheme/registry.ts` — layout/theme overrides
```ts
const SLUG_OVERRIDES: Partial<Record<string, TrBoutiqueHomeLayoutId>> = { "demo-maya": "editorial", pervinsoysalbutik: "editorial", lilabutik: "editorial" };
const SLUG_THEMES: Partial<Record<string, TrStorefrontThemeId>> = { pervinsoysalbutik: "editorial", lilabutik: "editorial", "demo-maya": "editorial" };
```
Same shape as 1b: `homeLayout` is already a real DB column and the code even has a comment acknowledging DB is supposed to win ("Storefront template — from DB; demo slugs may override"), but `SLUG_OVERRIDES` currently wins unconditionally over whatever's in the DB. `storefrontTheme/registry.ts` has no DB backing at all yet — it derives entirely from the hardcoded map plus the home layout.

## 2. Design decision needed before coding (ask Mert, don't guess)

**Since only `lilabutik` must keep working (confirmed 2026-09-22), and other boutiques can be broken/changed/deleted freely, this phase has a real simplification available:** instead of carefully preserving every existing slug's current behavior, the agent can treat this as "make `lilabutik` correct in the new system, and let every other boutique fall back to platform defaults." That's much less work than reverse-engineering what each demo/legacy boutique currently renders. **Recommend this framing explicitly to whoever runs the agent**, since it removes most of the migration risk from this phase.

## 3. New table: `tr_boutique_integrations` (payment/shipping capability + credentials)

This is the one piece with no existing DB shape. Proposed, for review before implementation:

```sql
-- supabase/patch_tr_boutique_integrations.sql
create table if not exists tr_boutique_integrations (
  id uuid primary key default gen_random_uuid(),
  boutique_id uuid not null references tr_boutiques(id) on delete cascade,
  provider text not null,              -- 'iyzico' | 'basit_kargo' | future providers
  mode text not null default 'sandbox', -- 'sandbox' | 'live'
  enabled boolean not null default false,
  credentials_encrypted text,           -- AES-256-GCM ciphertext, null until connected
  metadata jsonb not null default '{}', -- e.g. buyer-protection token/position for iyzico (not a secret — fine in plaintext jsonb, or keep alongside credentials, agent's call)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (boutique_id, provider)
);
-- RLS: service-role only, same pattern as tr_orders/tr_invoices (no public/anon access — this table holds encrypted secrets and must never be reachable by the anon key)
```
Encryption key: a new server-only env var (e.g. `TR_INTEGRATION_ENCRYPTION_KEY`), AES-256-GCM, matching the pattern noted in the roadmap. **Agent must not invent its own crypto — use a well-reviewed library (Node's built-in `crypto` module is fine for AES-256-GCM) and write a short note in the migration doc on how to rotate the key if it's ever needed.**

Helper functions in `src/lib/tr/payments/registry.ts` (replacing the hardcoded maps):
```ts
async function getBoutiqueIntegration(boutiqueId: string, provider: string): Promise<TrBoutiqueIntegration | null>
export async function boutiqueOffersIyzicoCheckout(boutiqueSlug: string | null | undefined): Promise<boolean>
export async function getIyzicoBuyerProtection(boutiqueSlug: string | null | undefined): Promise<TrIyzicoBuyerProtection | null>
```
Note these become **async** (DB read) where they were previously sync (in-memory Set/Record lookup) — every call site needs updating, not just the registry file. Grep all callers of `boutiqueOffersIyzicoCheckout` and `getIyzicoBuyerProtection` before starting and list them in the PR description.

**Dual-read for `lilabutik` only:** seed her row into `tr_boutique_integrations` with her current iyzico credentials (moved out of the env vars `TR_LILABUTIK_IYZICO_API_KEY` etc. into the encrypted column) as part of this migration, verify in sandbox that checkout still starts correctly, then remove the hardcoded `lilabutik` entries from the registry file. No fallback path needed given every other boutique is allowed to break.

## 4. Domain map — make the DB column the actual source of truth

- `src/middleware.ts` runs on the edge and currently reads `customDomain.ts`'s in-memory map (env JSON or the hardcoded default) because edge middleware can't easily do a per-request DB round trip.
- Fix: at build/deploy time or via a short-TTL cache, resolve `customDomain` from `tr_boutiques` into the same map shape `getBoutiqueDomainMap()` already returns. Two reasonable approaches, agent should pick one and say why:
  1. **Vercel Edge Config** — write the domain→slug map to Edge Config whenever a boutique's `customDomain` changes (via the owner/admin route that updates it), middleware reads Edge Config instead of the hardcoded object.
  2. **Short-TTL in-memory cache at the edge** — middleware calls a lightweight internal endpoint or does a direct fetch to Supabase with a 60–300s cache, accepting slight propagation delay.
- Either way: delete `DEFAULT_DOMAIN_MAP`'s hardcoded entries once the DB-backed path is verified working for `lilabutik`'s domain (`lilaboutiquedenizli.com`). Other domains (Pervin, Minimora) can be dropped entirely if those boutiques are being deleted per Mert's go-ahead — check with Phase 0 follow-up whether that's already happened before touching this.

## 5. Layout/theme overrides — let the DB column win

- Simplify `resolveBoutiqueHomeLayout()` to just read `homeLayout` off the boutique record with no slug-keyed override map. Set `lilabutik`'s `homeLayout` DB column to `"editorial"` (confirm it isn't already — check before assuming) so removing the hardcoded override doesn't change her rendering.
- `storefrontTheme/registry.ts`'s `SLUG_THEMES` can likely collapse entirely into `resolveBoutiqueHomeLayout`'s output, since today it's just re-deriving the same editorial/default split per slug with no independent data. Agent should confirm no boutique currently has a theme that diverges from its layout before deleting `SLUG_THEMES` — if `pervinsoysalbutik`/`demo-maya` are gone by this point, `lilabutik` is the only one that matters here anyway.

## 6. Contact email — smallest item, do it first as a warm-up

- Add a nullable `contact_email` text column to `tr_boutiques` (additive patch, trivial).
- `resolveBoutiqueContactEmail()` reads it instead of `CONTACT_EMAIL_BY_SLUG`.
- Backfill `lilabutik`'s row with `ncp20@outlook.com` before removing the hardcoded map entry.

## 7. Order of work (each is a separate PR/commit, in this order)

1. **Contact email** (§6) — smallest, builds confidence in the dual-read → verify → remove-legacy pattern before the bigger pieces.
2. **Layout/theme** (§5) — no new table needed, just stops one hardcoded map from winning over an existing column.
3. **Domain map** (§4) — needs the edge-config design decision (§2-adjacent); flag the two options to Mert if not already decided.
4. **Payments/integrations table** (§3) — the biggest piece; money-path, needs sandbox verification per the repo's rule 9 (agents must actually exercise payment flows, not just compile them).

## 8. Acceptance check for the whole phase

- A boutique row can be created (even by hand in Supabase for now — self-serve creation is Phase 1B/2) with `homeLayout`, `customDomain`, `contact_email`, and a `tr_boutique_integrations` row, and it renders correctly, resolves its domain, shows the right contact email, and can complete a sandbox iyzico checkout — **with zero code changes**.
- `lilabutik`'s live storefront, checkout, payment, and shipping path behave identically before and after (test a real or sandbox order at the end of the phase).
- `grep` confirms no remaining references to `IYZICO_CHECKOUT_SLUGS`, `IYZICO_BUYER_PROTECTION_BY_SLUG`, `CREDENTIAL_ENV_BY_SLUG`, `DEFAULT_DOMAIN_MAP` (hardcoded entries), `CONTACT_EMAIL_BY_SLUG`, `SLUG_OVERRIDES`, `SLUG_THEMES` outside of migration/seed scripts.
- `npm run build` and lint/typecheck pass.

## 9. Explicitly out of scope for this phase

- Public self-serve signup (Phase 1B internal tool, then Phase 2 later).
- Actually building the connect-your-own-iyzico-keys UI (Phase 3) — this phase only builds the storage and the read path.
- Theme editor UI, billing, domains-from-panel — later phases per the roadmap.
- Don't touch `lilabutik`'s live iyzico credentials in a way that risks an outage — migrate her into the new table, verify with a sandbox charge, and only then remove the env-var path. If anything is uncertain, stop and ask rather than experimenting against her live keys.
