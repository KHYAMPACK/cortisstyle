# 11 — Platform ops

**What this is:** environment/deployment plumbing that doesn't fit neatly under a subsystem — the edge proxy, auth, scripts, and the repo-wide boundary rule.

## Edge proxy

`src/proxy.ts` — **not** `middleware.ts` (this is a customized Next.js fork; check `node_modules/next/dist/docs/` before assuming standard Next.js conventions). Handles, in order: maintenance-mode gate (`isMaintenanceModeEnabled()`) and custom-domain resolution/rewrite (`resolveBoutiqueSlugFromHostAtEdge()` — see [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)). Its matcher skips `/api/*`. Root `/` renders its own page (`src/app/page.tsx`, the platform marketing homepage) — it is no longer redirected to `/tr`, which has no page since the Cadde marketplace was retired.

## Auth

Three separate auth surfaces, don't cross them: `src/lib/tr/adminAuth.ts` (Bearer `TR_ADMIN_SECRET`, for `/api/tr/admin/*`), `src/lib/tr/ownerAuth.ts` (boutique owner panel), `src/lib/tr/customerAuth.ts` (storefront customer accounts, branded OTP per boutique via `authMail/templates.ts`).

## Tenancy boundary

Every table that holds boutique-scoped data carries a `boutique_id` foreign key; API routes and RLS policies enforce that an owner/customer session only ever touches its own boutique's rows. If you're adding a new table that holds per-boutique data, it needs `boutique_id` and a matching RLS policy — don't rely on application-code filtering alone.

## The fashion/core import boundary

`eslint.config.mjs` has an `import/no-restricted-paths` rule preventing a defined "fashion-free core" zone from importing `src/lib/tr/fashion/**` / `src/components/tr/fashion/**` — see [06-fashion-module.md](./06-fashion-module.md) for the full rationale and the current target-zone list. This is currently the only cross-module lint boundary in the repo; there's no equivalent rule for `customArt/` yet (it's small enough that it hasn't needed one).

## Scripts (`package.json`)

| Script | Purpose |
|---|---|
| `dev` / `dev:webpack` | Local dev server (Turbopack default, `--webpack` fallback) |
| `build` / `start` | Production build/serve |
| `lint` | ESLint (flat config, `eslint.config.mjs`) |
| `favicon:generate` | `scripts/generate-favicon.mts` |
| `tr:generate-studio-models` | `scripts/generate-studio-ai-models.mts` — AI house-model reference plates (feeds `aiModel/registry.ts`, doc 08) |
| `tr:generate-lila-review` | `scripts/generate-lila-model-review.mts` |

Note: there is no Vite "studio" app, dev server, or item-draft CLI in this repo — those belong to the sibling `cortisstyle-international` repo (see `02-lookbook-studio.md`). If you see a doc or comment referencing `dev:studio` or an item-draft script, it's stale — check `package.json` directly rather than trusting the doc.

## Environment variables (non-exhaustive — check `.env.example` / Vercel project settings for the full list)

- `TR_ADMIN_SECRET` — admin API bearer token.
- `TR_BOUTIQUE_DOMAINS` — JSON host→slug override map, used only for hosts not yet in `tr_boutiques.custom_domain` (see doc 03). Not the primary domain-resolution mechanism.
- `TR_CHECKOUT_SANDBOX` — forces pending-order checkout even with a live payment integration (staging).
- `TR_INTEGRATION_ENCRYPTION_KEY` — AES-256-GCM key for `tr_boutique_integrations.credentials_encrypted` (payment/shipping credentials at rest). Server-only, Vercel "sensitive" type. Rotation requires decrypting every row with the old key and re-encrypting with the new one in one pass — see `src/lib/tr/payments/credentialEncryption.ts`.

## Supabase

Schema changes live as SQL patches under `supabase/*.sql` (applied via the Supabase MCP `apply_migration` tool or the dashboard, not hand-run against prod without review). Deployment is Vercel.

## Related

- Fashion/core boundary details: [06-fashion-module.md](./06-fashion-module.md)
- Tenant resolution (the proxy's main job): [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)
- Payments env-vs-DB transition: [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
