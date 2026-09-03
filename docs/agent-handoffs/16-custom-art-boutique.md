# 16 — Custom art boutique (print-on-demand tablo)

**Vertical:** `catalog_profile = custom_art` on `tr_boutiques`.

**Use case:** Standalone boutique where customers upload a photo on the PDP, pick canvas size/style, and order. Owner fulfills from **Siparişler** only — no Ürünler/Stok panel.

## Where it lives

| Concern | Location |
|---------|----------|
| Profile registry | `src/lib/tr/catalogProfiles/` |
| Custom art PDP | `src/components/tr/boutique/pdp/TrCustomArtProductPanel.tsx` |
| Customer upload API | `POST /api/tr/customer/upload-reference` |
| Reference storage | `tr-assets/customer-references/{boutiqueId}/` |
| Pricing per size | `features.sizePricesKurus` on the single product |
| Made-to-order flag | `features.madeToOrder` — skips stock checks + inventory decrement |
| Panel nav filter | `panelNavForProfile()` in `src/lib/tr/panel/panelNav.ts` |
| Product route gate | `TrOwnerProductRouteGate` |
| SQL | `supabase/patch_tr_boutiques_catalog_profile.sql`, `patch_tr_order_items_customization.sql` |
| Example seed | `src/data/tr/ozeltablo-seed.json` |

## Tenant wire-in

1. Apply SQL patches (catalog_profile + order item customization).
2. Re-run `patch_tr_boutiques_public_view.sql` (includes `catalog_profile`).
3. Copy/adjust `ozeltablo-seed.json` → set slug, WhatsApp, legal, assets.
4. `POST /api/tr/admin/seed` with `TR_ADMIN_SECRET`.
5. Link owner via `scripts/link-tr-boutique-owner.md`.
6. Add brand registries in `boutiqueBrand.ts` + `authMail/templates.ts` if needed.
7. Assets under `public/tr/boutiques/{slug}/` (logo, favicon, example gallery).

## Panel behavior (`custom_art`)

- **Hidden:** Ürünler, Stok, Yeni ürün / AI credits on home.
- **Visible:** Siparişler (with customer reference photo on detail), Müşteriler, İndirimler, Ayarlar, Raporlar, Faturalar.
- Direct `/tr/panel/urunler` → redirect Siparişler.

## Storefront behavior

- `resolveBoutiquePdpLayout(boutique)` → `custom_art` when profile is set.
- One seeded product; home CTA → PLP or product.
- Classic editorial skin (not atelier fashion taxonomy).

## What not to do

- Do not fork checkout or orders — extend line items with `reference_image_url` + `customization`.
- Do not expose fashion AI catalog / construction upload for `custom_art` boutiques.
- Do not add Cadde listing for print-on-demand tenants (standalone only).

## Related

- Clone rails: [09-boutique-clone-playbook.md](./09-boutique-clone-playbook.md)
- Wire-in checklist: [13-boutique-wire-in-and-go-live.md](./13-boutique-wire-in-and-go-live.md)
