# 08 — Pervin Soysal Butik audit (standalone boutique lens)

**Date:** 2026-08-08 (updated after fix pass)  
**Scope:** Treat the boutique as its own shop (not Cadde marketplace). Storefront `/tr/pervinsoysalbutik` (+ custom domain `pervinsoysal.com`), owner panel `/tr/panel`, local cart/favorites/checkout/orders/auth.

**Verdict (go-live prep):** Checkout creates **pending** orders by default (not sandbox theater). Stock, size, coupons, confirm HMAC, owner mark-paid, and honest banners are in place. **Still no iyzico capture** — set `TR_IYZICO_ENABLED` only after wiring. Apply SQL patches; replace demo-maya seed images; set `TR_ORDER_CONFIRM_SECRET`. See [12-boutique-go-live.md](./12-boutique-go-live.md).

---

## Status by surface

| Surface | Status | Notes |
|---------|--------|-------|
| Storefront (editorial) | **Working** | Home/PLP/PDP/legal; brand overrides for Pervin |
| Customer auth (`/giris`) | **Improved** | Reset prefers custom-domain origin; boutique TR copy on reset page |
| Favoriler | **Working** | Per-slug; size gate when adding to cart |
| Sepet | **Working** | Selection persisted to checkout via sessionStorage |
| Ödeme / checkout | **Working** (sandbox) | Server reprice + ownership + stock + size + coupon |
| Sipariş onayı (customer) | **Working** | Loads order by `?order=` when it belongs to boutique |
| Owner panel gate | **Working** | Bearer + `owner_user_id` |
| Ürünler / stok / yeni-düzenle | **Working** | |
| Siparişler (owner) | **Partial** | Real list/fulfillment + size; cargo still demo (labeled) |
| Müşteriler | **Working** | |
| Kampanyalar | **Working** | Compare-at + coupons applied at checkout |
| İçerik | **Stub UI** | Backend exists; route gated |
| Raporlar / Ana Sayfa KPIs | **Working** | Live zeros when empty (no fake ciro) |
| Faturalar | **Demo** (labeled) | |
| Real card pay (iyzico) | **Not wired** | Always `isSandbox: true` |

---

## Required SQL (run in Supabase)

- `supabase/patch_tr_order_items_size.sql`
- `supabase/patch_tr_orders_discount.sql`

(Plus existing boutique/product/fulfillment/discount patches — see seed script.)

---

## Remaining holes

| Severity | Issue |
|----------|--------|
| **High** | No iyzico / real card capture — sandbox orders only |
| **Medium** | Custom-domain ↔ `.cortisstyle.com` session still not SSO for normal login |
| **Medium** | True multi-row DB transaction for checkout (mitigated: reserve stock first + restore on fail; optimistic locks) |
| **Low** | Cart/favorites device-local only |
| **Low** | Pervin `slug ===` hardcodes / registries for clone tax |
| **Ops** | Clean absurd test prices on live catalog; run size+discount SQL patches |

### Fixed in follow-up pass (auth rate limit + pessimistic audit)

- Auth OTP/reset rate limits (per IP + email)
- Checkout rate limits + server field validation
- Order confirm token (no bare UUID IDOR)
- Stock: empty `size_stocks` no longer “unlimited”; sold→available on restock; cancel restores stock
- Inventory reserved before order insert; restore on failure; optimistic stock lock
- Atomic-ish coupon usage increment
- Demo catalog only for `demo-*` slugs
- Owner order detail filters to boutique lines + shows discount
- Ops copy: no fake kurye / auto-fatura claims
- Empty cart no longer shows “demo alışveriş” banner

---

## Related docs

- Clone playbook: [09-boutique-clone-playbook.md](./09-boutique-clone-playbook.md)
- Storefront map: [03-boutique-storefronts.md](./03-boutique-storefronts.md)
- Commerce: [05-commerce-rails.md](./05-commerce-rails.md)
