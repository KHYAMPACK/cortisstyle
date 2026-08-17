# 07 — Platform ops (env, DB, auth, conventions)

**Role:** Cross-cutting facts every agent needs so they don’t fight the architecture.

## Conventions

- UI in `src/components/**`; business logic in `src/lib/**`
- Prefer env, shared constants, data files, **registries** over scattered literals
- Next.js 16 ≠ older Next — check `node_modules/next/dist/docs/`
- Motion: keep transitions intentional (`.cursor/rules/smooth-transitions.mdc`)
- Money in TR: integer **kuruş**
- SQL: incremental `supabase/patch_*.sql` — no automated migrator; document when adding patches
- Shopper contact on `profiles`: `supabase/patch_tr_customer_profile_fields.sql` (`first_name`, `last_name`, `phone`). Optional at boutique signup after OTP (“sizi tanıyalım”); editable later from boutique Hesabım (`TrBoutiquePersonalInfo` — name + phone; email is display-only). Phone is format-checked only if provided, not SMS-OTP. Optional “bizi nereden duydunuz?” after password (`instagram` / `internet` / `ai` / `word_of_mouth`) — `supabase/patch_tr_customer_signup_discovery.sql`. One platform profile across boutiques.
- Offline invoices: apply `supabase/patch_tr_invoices.sql` (buyer tax on orders + `tr_invoices`; GİB later)
- Drop dormant intl tables (once): `supabase/patch_drop_international_tables.sql` — keeps `profiles` + all `tr_*`
- Boutique public view: `supabase/patch_tr_boutiques_public_view.sql`
- Boutique 404 diagnose SQL: `supabase/fix_tr_boutiques_public_visibility.sql`
- Products public RLS (empty storefront catalog): `supabase/patch_tr_products_public_read_via_view.sql`
- Product PDP specs JSON: `supabase/patch_tr_product_features.sql` (`tr_products.features`)
- Boutique health (admin): `GET /api/tr/admin/boutique-health` — Bearer `TR_ADMIN_SECRET`

## Auth matrix

| Actor | Mechanism | Entry |
|-------|-----------|--------|
| Shopper | Supabase Auth | `AuthContext`, cookie storage |
| Boutique owner | JWT → boutiques where `owner_user_id` matches | `lib/tr/panel/ownerAuth.ts`, `/tr/panel` |
| TR admin | Bearer `TR_ADMIN_SECRET` (timing-safe compare) | `lib/tr/panel/adminAuth.ts`, `/api/tr/admin/*` |

Middleware does **not** enforce general login — it handles maintenance, `/` → `/tr`, and custom domain rewrite (`src/middleware.ts`).

### Tenancy boundary (important)

- **Orders, discounts, invoices, push subscriptions:** app uses **service role** after `requireTrOwner` / admin checks. RLS is fail-closed for anon; it is **not** the owner tenancy boundary.
- **Public boutiques:** read `tr_boutiques_public` via **anon server client** (`getPublicCatalogSupabase` in `src/lib/supabase/supabaseServer.ts`) so a bad/rotated `SUPABASE_SERVICE_ROLE_KEY` cannot 404 storefronts. Apply `supabase/patch_tr_boutiques_public_view.sql` so anon cannot `SELECT *` sensitive columns on `tr_boutiques` (IBAN, contact, shipping addresses). View filter: `status = 'verified'` only.
- **Public products:** RLS must `EXISTS` against `tr_boutiques_public`, not `tr_boutiques`. After the view patch revoked anon `SELECT` on the base table, the old products policy hid **every** SKU on storefronts while the owner panel (service role) still showed them. Fix: `supabase/patch_tr_products_public_read_via_view.sql`. App also retries service role if anon product reads return empty/error.
- **Storefront 404 (“Butik bulunamadı”):** layout calls `notFound()` when `safeGetPublicBoutique` returns null. Check SQL `fix_tr_boutiques_public_visibility.sql`, then `/api/tr/admin/boutique-health`. Demo `demo-maya` is code-only and does not prove DB connectivity.
- **Order confirm tokens:** require `TR_ORDER_CONFIRM_SECRET` in production (no fallback to service role / admin secret).
- **PhotoRoom panel cutout:** `src/lib/tr/ai/photoroomRemoveBg.ts` + `PHOTOROOM_API_KEY` — not Lookbook Studio.

### Boutique password reset

Branded reset (`/api/tr/customer/auth/send-password-reset`) uses `admin.generateLink` then emails a **`token_hash` callback** (`buildPasswordResetCallbackUrl` → `/auth/callback?token_hash=…&type=recovery&next=…`). Do **not** email Supabase `action_link` for this path — it is implicit/non-PKCE and often never establishes a session in `AuthCallbackHandler`. Callback verifies via `verifyOtp`, then routes to `/auth/reset-password?boutique={slug}`.

**Origin:** prefer boutique custom domain (request host → DB `customDomain` → `TR_BOUTIQUE_DOMAINS` map) so reset stays white-label; platform host is fallback with `/tr/{slug}/giris` return. Password remains one platform credential (works across boutiques); only the link + UI are boutique-branded.

## Important env vars (non-exhaustive)

| Var | Area |
|-----|------|
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | DB/auth |
| `NEXT_PUBLIC_SITE_URL` | Origins / auth redirects |
| `TR_ORDER_CONFIRM_SECRET` | Order confirmation HMAC (required in production) |
| `PHOTOROOM_API_KEY` | Panel / packshot background removal |
| `FASHN_API_KEY` | Packshot + try-on + studio `model-create` |
| `FASHN_DEFAULT_RESOLUTION` / `FASHN_DEFAULT_MODE` | Ops / studio refs only (default `1k` / `fast`). Catalog upload is pinned to fast+1k (1 FASHN credit / output) |
| `TR_CHECKOUT_ENABLED` / `NEXT_PUBLIC_TR_CHECKOUT_ENABLED` | Cadde checkout gating (`next.config` mirrors private → public) |
| `TR_CHECKOUT_SANDBOX` / `NEXT_PUBLIC_TR_CHECKOUT_SANDBOX` | Staging sandbox orders (default off → pending) |
| `TR_IYZICO_ENABLED` / `NEXT_PUBLIC_TR_IYZICO_ENABLED` | Hide “kart yakında” banner — only when card capture is live |
| `TR_SHIPPING_BASITKARGO_TOKENS` | Lila Basit Kargo JSON `{"lilabutik":"…"}` (registry-gated) |
| `TR_SHIPPING_BASITKARGO_WEBHOOK_SECRET` | Shared secret for `POST /api/tr/shipping/basitkargo/webhook` (Bearer **or** `?secret=`). Set the same value in Basit panel → Ayarlar → Webhook. |
| `TR_ORDER_CONFIRM_SECRET` | HMAC for sipariş-onay links (required in production) |
| `TR_VAPID_PUBLIC_KEY` / `TR_VAPID_PRIVATE_KEY` / `TR_VAPID_SUBJECT` | Owner panel Web Push (`next.config` mirrors public key → `NEXT_PUBLIC_TR_VAPID_PUBLIC_KEY`) |
| `TR_ADMIN_SECRET` | Admin APIs |
| `TR_BOUTIQUE_DOMAINS` | Host → slug JSON for Edge |
| `MARKET_DEV_COUNTRY` | Fake geo in dev |
| `PHOTOROOM_*`, `GEMINI_*` / `OPENAI_*` | Vision / BG removal |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Site gate |

Template file: `localdevseeds` (sparse — grep the feature area).

## Scripts

| Script | Use |
|--------|-----|
| `npm run dev` | Next |
| `npm run dev:studio` | Vite studio |
| `npm run build` | Studio then Next |
| `npm run item:draft` | LLM item metadata CLI |
| `npm run tr:import-hero` | TR hero slot import |

## Don’ts

- Don’t commit secrets / real `.env`
- Don’t invent a second multi-tenant model beside `tr_boutiques`
- Don’t treat root `README.md` as product truth (still create-next-app boilerplate)
- Don’t expand demo catalogs as if they were production inventory

## First files to open by task type

| Task | Open first |
|------|------------|
| New TR page URL | `src/lib/tr/paths.ts` |
| Product fields | `src/types/tr-marketplace.ts` + mappers + relevant SQL patch |
| Owner UI | `src/components/tr/panel/` + `ownerClient.ts` |
| Marketplace chrome | `src/app/tr/(marketplace)/layout.tsx` |
| Domain rewrite | `customDomain.ts` + `middleware.ts` |
| Look content | `src/lib/tr/looks/` or `src/lib/dynamicLooks/` |
