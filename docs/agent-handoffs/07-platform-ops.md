# 07 — Platform ops (env, DB, auth, conventions)

**Role:** Cross-cutting facts every agent needs so they don’t fight the architecture.

## Conventions

- UI in `src/components/**`; business logic in `src/lib/**`
- Prefer env, shared constants, data files, **registries** over scattered literals
- Next.js 16 ≠ older Next — check `node_modules/next/dist/docs/`
- Motion: keep transitions intentional (`.cursor/rules/smooth-transitions.mdc`)
- Money in TR: integer **kuruş**
- SQL: incremental `supabase/patch_*.sql` — no automated migrator; document when adding patches
- Offline invoices: apply `supabase/patch_tr_invoices.sql` (buyer tax on orders + `tr_invoices`; GİB later)

## Auth matrix

| Actor | Mechanism | Entry |
|-------|-----------|--------|
| Shopper | Supabase Auth | `AuthContext`, cookie storage |
| Studio curator | Allowlist env and/or `studio_curators` | `/auth/studio`, studio APIs |
| Boutique owner | JWT → boutiques where `owner_user_id` matches | `ownerAuth.ts`, `/tr/panel` |
| TR admin | Bearer `TR_ADMIN_SECRET` | `adminAuth.ts`, `/api/tr/admin/*` |

Middleware does **not** enforce general login — it handles maintenance, geo, studio SPA, custom domain rewrite (`src/middleware.ts`).

### Boutique password reset

Branded reset (`/api/tr/customer/auth/send-password-reset`) uses `admin.generateLink` then emails a **`token_hash` callback** (`buildPasswordResetCallbackUrl` → `/auth/callback?token_hash=…&type=recovery&next=…`). Do **not** email Supabase `action_link` for this path — it is implicit/non-PKCE and often never establishes a session in `AuthCallbackHandler`. Callback verifies via `verifyOtp`, then routes to `/auth/reset-password?boutique={slug}`.

**Origin:** prefer boutique custom domain (request host → DB `customDomain` → `TR_BOUTIQUE_DOMAINS` map) so reset stays white-label; platform host is fallback with `/tr/{slug}/giris` return. Password remains one platform credential (works across boutiques); only the link + UI are boutique-branded.

## Important env vars (non-exhaustive)

| Var | Area |
|-----|------|
| `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | DB/auth |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STUDIO_URL` | Origins |
| `STUDIO_CURATOR_EMAILS` | Studio access |
| `TR_CHECKOUT_ENABLED` / `NEXT_PUBLIC_TR_CHECKOUT_ENABLED` | Cadde checkout gating (`next.config` mirrors private → public) |
| `TR_CHECKOUT_SANDBOX` / `NEXT_PUBLIC_TR_CHECKOUT_SANDBOX` | Staging sandbox orders (default off → pending) |
| `TR_IYZICO_ENABLED` / `NEXT_PUBLIC_TR_IYZICO_ENABLED` | Hide “kart yakında” banner — only when card capture is live |
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
