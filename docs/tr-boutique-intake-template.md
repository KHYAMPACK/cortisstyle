# TR boutique client intake template

> Fill this in with the client, then save it as a JSON file matching the shape below and run:
> `npx tsx scripts/create-boutique.mts --intake path/to/client.json`
>
> This maps 1:1 onto `POST /api/tr/admin/seed`'s payload (`src/app/api/tr/admin/seed/route.ts`) — the checklist below and the script accept exactly the same fields, so they can't drift out of sync. Only `slug` and `name` are required; everything else falls back to a sensible platform default if left out (see `docs/agent-handoffs/03-multi-tenant-boutiques.md`), but the fields marked **recommended** are worth getting from the client up front since they feed the legal pages (`docs/tr-boutique-legal-templates.md`) and checkout copy.

## Checklist

**Identity**
- [ ] `slug` — URL slug, lowercase, no spaces (e.g. `ornek-butik`). This becomes `/tr/{slug}`.
- [ ] `name` — display brand name.
- [ ] `legalName` (recommended) — legal seller name for invoices/legal pages, if different from brand name.
- [ ] `vergiNo` (recommended) — tax ID, for the künye page.
- [ ] `iban` — for payouts, once payments are connected (see `docs/agent-handoffs/05-owner-panel-commerce.md` — this is a separate, later step, not part of store creation).

**Contact**
- [ ] `contactEmail` (recommended) — falls back to `info@{customDomain}` or the platform default if omitted.
- [ ] `whatsappPhone` (recommended) — shown on storefront + used in legal pages.
- [ ] `instagramHandle`
- [ ] `physicalAddress` (recommended) — for legal pages (künye, mesafeli satış).

**Brand**
- [ ] `logoUrl` — path under `public/tr/boutiques/{slug}/` (no upload widget yet — drop the file in the repo, reference its path here).
- [ ] `themeAccent` — hex color.
- [ ] `description` — short storefront description.

**Storefront**
- [ ] `homeLayout` — `"editorial"` (recommended for a standalone boutique) or `"default"` (Cadde marketplace layout). See doc 04.
- [ ] `catalogProfile` — `"fashion"` or `"custom_art"`. See doc 06/07.
- [ ] `customDomain` — if they have one; DNS still needs pointing separately (doc 03 §"White-label domain").
- [ ] `shippingNote` / `exchangePolicy` — free-text, used in legal pages and PDP copy. Falls back to default kargo/iade copy if omitted.

**Starter products (optional)**
- [ ] `products` — array of `{ title, priceTry, sizes?, colors?, category?, images?, stock? }`. Can be left empty and added later via the panel or the batch upload flow.

**Not covered by this intake — separate steps**
- Owner login: the client signs up themselves at `/giris` after the store exists. Then run `scripts/link-tr-boutique-owner.mts` to connect their account.
- Payments (iyzico): connected later via a `tr_boutique_integrations` row — no owner-facing "connect your keys" UI exists yet (Phase 3, not built). Until then, checkout creates pending orders and the owner marks them paid by hand.
- Legal review: these are internal templates, not legal advice — see the banner in `docs/tr-boutique-legal-templates.md`.

## JSON shape (paste into a file, fill in, save)

```json
{
  "slug": "",
  "name": "",
  "legalName": "",
  "vergiNo": "",
  "contactEmail": "",
  "whatsappPhone": "",
  "instagramHandle": "",
  "physicalAddress": "",
  "logoUrl": "",
  "themeAccent": "",
  "description": "",
  "homeLayout": "editorial",
  "catalogProfile": "fashion",
  "customDomain": "",
  "shippingNote": "",
  "exchangePolicy": "",
  "products": []
}
```

Remove any empty fields you don't have yet rather than sending them as empty strings — an omitted field falls back to the platform default; an explicit empty string may not.

## After running the script

1. Send the client the storefront link (`/tr/{slug}`) and ask them to sign up at `/giris`.
2. Link their account: `npx tsx scripts/link-tr-boutique-owner.mts --email <their-email> --slug <slug>`.
3. Log the time from "yes" to here in `docs/onboarding-time-log.md`.
4. Run the go-live check once it exists (Phase 1B-T4, not built yet as of this template's writing) before telling the client they're live.
