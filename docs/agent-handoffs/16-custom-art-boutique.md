# 16 — Custom art boutique (print-on-demand)

**Vertical:** `catalog_profile = custom_art` on `tr_boutiques`.

**Use case:** Standalone boutique where customers upload a drawing on the PDP, pick size/style, and order. Owner fulfills from **Siparişler** only — no Ürünler/Stok panel.

**Minimora (`minimora.shop`):** One-off storefront. Visual source is the [Petit Wonder demo](https://wonder-theme-petit-demo.myshopify.com/) layout (type, chrome, section rhythm) with **Minimora copy** — not baby-monitor content. Code: `src/components/tr/boutique/minimora/` (`TrMinimoraHomePage`, `TrMinimoraHeader`, `TrMinimoraFooter`). Branched only in `TrBoutiqueEditorialHome` + `TrBoutiqueEditorialShell` when `isMinimoraBoutique(slug)`.

## Where it lives

| Concern | Location |
|---------|----------|
| Profile registry | `src/lib/tr/catalogProfiles/` |
| **Minimora home (one-off)** | `src/components/tr/boutique/minimora/` |
| Custom art PDP | `src/components/tr/boutique/pdp/TrCustomArtProductPanel.tsx` |
| Customer upload API | `POST /api/tr/customer/upload-reference` |
| Reference storage | `tr-assets/customer-references/{boutiqueId}/` |
| Pricing per size | `features.sizePricesKurus` on the single product |
| Made-to-order flag | `features.madeToOrder` — skips stock checks + inventory decrement |
| Panel nav filter | `panelNavForProfile()` in `src/lib/tr/panel/panelNav.ts` |
| Product route gate | `TrOwnerProductRouteGate` |
| SQL | `supabase/patch_tr_custom_art_vertical.sql` (all-in-one) |
| Example seed | `src/data/tr/minimora-seed.json` |

## Tenant wire-in

1. Apply SQL patches (catalog_profile + order item customization + public view).
2. Seed via `scripts/seed-minimora.mts` or admin seed with `minimora-seed.json`.
3. Link owner via `scripts/link-tr-boutique-owner.mts`.
4. Home photos: `public/tr/boutiques/minimora/home/` (see `minimoraHomeContent.ts` paths).
5. Brand registries in `boutiqueBrand.ts` (accent `#F3A575`, logo `public/tr/boutiques/minimora/logo.png`).
6. Contact: seed `whatsappPhone` / `physicalAddress` / `instagramHandle`; storefront email in `CONTACT_EMAIL_BY_SLUG` (`checkoutMode.ts`). Legal pages pull the same fields. Still need `legalName` (şahıs/şirket unvanı) + `vergiNo` before go-live.

## Panel behavior (`custom_art`)

- **Hidden:** Ürünler, Stok, Yeni ürün / AI credits on home.
- **Visible:** Siparişler (with customer reference photo on detail), Müşteriler, İndirimler, Ayarlar, Raporlar, Faturalar.
- Direct `/tr/panel/urunler` → redirect Siparişler.

## Storefront behavior

- `resolveBoutiquePdpLayout(boutique)` → `custom_art` when profile is set.
- One seeded product; home CTAs → product PDP.
- **Minimora only:** Petit-layout landing + chrome (header/footer/PDP restyle); copy stays Minimora. Other `custom_art` tenants would need their own fork if added later.

## What not to do

- Do not fork checkout or orders — extend line items with `reference_image_url` + `customization`.
- Do not expose fashion AI catalog / construction upload for `custom_art` boutiques.
- Do not add Cadde listing for print-on-demand tenants (standalone only).
- Do not generalize Minimora home into a reusable skin unless a second tenant needs it.

## Related

- Clone rails: [09-boutique-clone-playbook.md](./09-boutique-clone-playbook.md)
- Wire-in checklist: [13-boutique-wire-in-and-go-live.md](./13-boutique-wire-in-and-go-live.md)
