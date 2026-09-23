# Migrate lilabutik's iyzico credentials into the DB (P1-T6)

**Why:** lilabutik's live iyzico checkout currently runs entirely on env vars (`TR_LILABUTIK_IYZICO_API_KEY`/`SECURITY_KEY` in `src/lib/tr/payments/registry.ts`). `tr_boutique_integrations` has zero rows — the encrypted-DB path exists in code but has never actually been used. This script moves her real credentials into that table so the legacy env-var fallback can finally be deleted.

**Why an agent can't just do this:** `TR_INTEGRATION_ENCRYPTION_KEY`, `TR_LILABUTIK_IYZICO_API_KEY`, and `TR_LILABUTIK_IYZICO_SECURITY_KEY` are all Vercel **sensitive**-type env vars — by design, Vercel's API never returns their value once set, even to an authenticated request. Only a `vercel` CLI session run by someone with project access (i.e. you, locally) can pull them.

## Steps

1. **Pull real production secrets into a local, gitignored file** (`.env*` is already in `.gitignore` — this file will never get committed):
   ```bash
   vercel env pull .env.production.local --environment=production
   ```

2. **Dry run first** — validates everything (env vars present, boutique found, no existing row, encryption round-trips correctly) without writing anything:
   ```bash
   npx tsx scripts/migrate-lilabutik-iyzico-credentials.mts --env-file .env.production.local --dry-run
   ```
   It prints your keys masked (`abcd****************wxyz`) so you can sanity-check it picked up the right values — never the full secret.

3. **Run it for real:**
   ```bash
   npx tsx scripts/migrate-lilabutik-iyzico-credentials.mts --env-file .env.production.local
   ```
   This writes one row to `tr_boutique_integrations` (`boutique_id` = lilabutik, `provider` = `iyzico`, `mode` = `live`, `enabled` = `true`, encrypted credentials, and the buyer-protection badge metadata that's already public in `registry.ts`). It refuses to run if a row already exists for her — delete it first if you intend to replace it.

4. **Verify checkout still works.** `getIyzicoCredentials()` in `registry.ts` already checks the DB first — as soon as the row exists, lilabutik's checkout reads from it instead of the env vars. Place a real or sandbox order and confirm the iyzico payment form still starts correctly.

5. **Delete the local secrets file** once you're done — it has real production credentials in plaintext on disk:
   ```bash
   rm .env.production.local
   ```

6. **Tell the agent it worked.** Once step 4 is confirmed, the legacy fallback (`IYZICO_CHECKOUT_SLUGS`, `IYZICO_BUYER_PROTECTION_BY_SLUG`, `CREDENTIAL_ENV_BY_SLUG`, and the `CREDENTIAL_ENV_BY_SLUG` env-var read path in `getIyzicoCredentials()`) can be deleted from `src/lib/tr/payments/registry.ts` — that's the rest of P1-T6, and it's a pure code change with no secrets involved.
