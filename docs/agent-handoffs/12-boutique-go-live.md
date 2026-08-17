# 12 — Boutique go-live readiness

**Audience:** ops + agents preparing a boutique for real customers (Pervin first, then clones).

**Full wire-in + checklist:** [13-boutique-wire-in-and-go-live.md](./13-boutique-wire-in-and-go-live.md) (prefer that for the next boutique). This page keeps **payment / env** truth.

## Payment mode (until iyzico is live)

| Env | Effect |
|-----|--------|
| `TR_CHECKOUT_SANDBOX` unset/`false` | Orders are **`pending`** (real records, stock reserved). Banner: kart ödemesi yakında. |
| `TR_CHECKOUT_SANDBOX=true` | Staging only — `sandbox` payment_status, deneme banner. |
| `TR_IYZICO_ENABLED=true` (+ sandbox off) | Banner hidden — set **only** when card capture is actually wired. |
| `TR_CHECKOUT_ENABLED` | Checkout/API gating for Cadde; **does not** mean card pay is live. |

**Do not** leave `TR_CHECKOUT_SANDBOX=true` on production.  
**Do not** set `TR_IYZICO_ENABLED=true` until iyzico capture lands.

Until then: owner can **“Ödendi olarak işaretle”** on pending orders (havale / WhatsApp).

When iyzico ships: capture → set `payment_status: paid` (inventory already reserved at create).

## Required secrets (production)

| Var | Why |
|-----|-----|
| `TR_ORDER_CONFIRM_SECRET` (or `TR_ADMIN_SECRET`) | HMAC for `/siparis-onay` links — **required in production** (no hardcoded fallback). |
| `TR_ADMIN_SECRET` | Protect seed / admin routes |
| `TR_BOUTIQUE_DOMAINS` | Custom domain → slug map |

## Removed / honest stubs (no fake ops)

- Faturalar → offline registry (`tr_invoices`): draft on mark-paid, mark issued + external no (no fake GİB)
- Kargo etiket yazdır → removed
- Storefront kargo takip / yardım → honest + WhatsApp
- Fake newsletter → Instagram / WhatsApp
- Demo catalog inject → only `demo-*` slugs
- Free-shipping / “güvenli ödeme” defaults softened

## Still required before “full” live

1. SQL: `patch_tr_order_items_size.sql`, `patch_tr_orders_discount.sql` (+ earlier)
2. Real product photos (no `demo-maya` seed images on prod)
3. Delete sample/sandbox seed orders from prod DB
4. Legal pages from shared templates (`src/lib/tr/legal/docs.ts` / [tr-boutique-legal-templates.md](../tr-boutique-legal-templates.md)); lawyer review recommended
5. Fill `legalName` / tax / MERSIS on boutique
6. iyzico application + wire → then `TR_IYZICO_ENABLED=true`
7. Carrier: **per-boutique** — Lila = Basit Kargo (`patch_tr_order_shipments.sql` + env); Pervin still manual
8. e-Fatura / GİB API (offline Faturalar scaffold is enough for soft-live)
9. Backfill `size_stocks` for sized SKUs
10. Set boutique `shippingNote` (announcement bar no longer invents free shipping)

## Smoke before launch

1. Cart + beden → checkout → **pending** order in panel + nav badge
2. Owner marks paid → ciro updates; cancel restores stock
3. Confirm URL without token fails; with token shows “Ödeme bekleniyor”
4. Coupon applies; auth OTP rate-limits
5. Custom domain `/giris`, `/sepet`, `/odeme`
6. No demo etiket / fatura / takip theater

See also: [08-boutique-audit-pervin.md](./08-boutique-audit-pervin.md), [09-boutique-clone-playbook.md](./09-boutique-clone-playbook.md).
