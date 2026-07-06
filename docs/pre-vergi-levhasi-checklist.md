# Pre–Vergi Levhası Checklist — Cortisstyle / Lookbook

Things you **can** do now while waiting to register (vergi levhası, ETBİS, iyzico). The TR shop cannot legally take payments until registration is done — but most of the product, content, and sales prep can happen in parallel.

> **Disclaimer:** Internal planning doc — not legal or tax advice. Affiliate income may still be taxable even before vergi levhası; talk to a muhasebeci when you start earning.

---

## What you CANNOT do yet (without vergi levhası)

| Activity | Why blocked |
|----------|-------------|
| Live TR checkout (iyzico) | iyzico requires vergi levhası + business bank account |
| ETBİS registration | Needs vergi kimlik / MERSİS |
| Issue commission invoices to boutiques | Need registered business |
| Formal marketplace launch | Mesafeli satış + aracı hizmet sağlayıcı obligations attach at first sale |
| Claim full legal TR e-commerce compliance | Registration is the foundation |

**You can still build, talk to boutiques, curate content, and prepare everything so launch is fast the day paperwork is done.**

---

## Tier 1 — Do now (no registration needed)

### Product & code

- [ ] Build `/tr` route structure (pages, layouts, navigation)
- [ ] Geo-detection middleware (Turkish IP → `/tr`, with manual toggle)
- [ ] Boutique page template — `cortisstyle.com/tr/[boutiqueSlug]`
- [ ] Product detail page UI (photos, price, size, seller name placeholder)
- [ ] Cart UI (zustand store)
- [ ] Checkout UI mock (address form, order summary — **no live payment**)
- [ ] Outfit builder UX — mix items from multiple boutiques in one look
- [ ] Reuse existing lookbook components (`LookItemsPanel`, look cards, studio)
- [ ] iyzico **sandbox** integration (test mode only)
- [ ] Order flow wire-up with fake/sandbox payments
- [ ] Admin view or spreadsheet-backed product list (v1 inventory)

### Content & curation

- [ ] Talk to mom's boutique contacts — pitch the concept, gauge interest
- [ ] Collect sample product photos from interested boutiques (informal)
- [ ] Curate 5–10 cross-boutique looks in Studio (no public checkout yet)
- [ ] Write item descriptions (size, condition, measurements)
- [ ] Plan launch looks and hero boutique for week 1

### Legal & docs (draft only — publish before first sale)

- [ ] Draft mesafeli satış sözleşmesi (template)
- [ ] Draft ön bilgilendirme formu
- [ ] Draft iade / cayma hakkı politikası
- [ ] Draft KVKK aydinlatma metni (TR section)
- [ ] Draft boutique sözleşmesi (seller = boutique, you = platform)
- [ ] Boutique onboarding checklist (vergi levhası, IBAN, contact, return address)

### Brand & international side (parallel)

- [ ] Keep building international lookbook + affiliate prep
- [ ] Fix affiliate disclosure timing (don't claim Amazon Associate until approved)
- [ ] Audit shop URLs — remove placeholder/broken links before affiliate goes live
- [ ] Social accounts (TikTok / Instagram) — content, not sales yet

---

## Tier 2 — Do now (soft legal gray — low risk at zero revenue)

| Activity | Notes |
|----------|--------|
| Apply to Amazon Associates / affiliate networks | Uses personal tax info (W-8BEN); Turkish income still taxable later |
| Drive traffic to editorial lookbook | Fine — no TR sales |
| Mom introduces you to boutique owners | Conversations and LOIs only — no money |
| "Coming soon" TR landing page | OK if no checkout and no "buy now" |

**Avoid:** Taking money for TR products, even via IBAN/DM "workaround." That creates messier legal/tax problems than waiting for iyzico.

---

## Tier 3 — Prepare so vergi levhası day is fast

Have these ready the week you register:

### Documents to gather (for yourself)

- [ ] Kimlik
- [ ] İkametgah
- [ ] 2 vesikalık foto
- [ ] Decide: esnaf vs şirket (ask muhasebeci before visiting vergi dairesi)
- [ ] Pick ticari unvan (Cortisstyle now, Lookbook later — or wait if buying domain soon)
- [ ] Faaliyet kodu shortlist (giyim perakende / e-ticaret aracılık)

### Documents to request from first boutiques (don't list until signed + verified)

- [ ] Vergi levhası copy
- [ ] Legal business name
- [ ] IBAN
- [ ] Shipping/return address
- [ ] Contact phone
- [ ] Product list with photos and prices

### Infrastructure checklist (day 1 after vergi levhası)

- [ ] Vergi dairesi → vergi levhası
- [ ] Noter → imza sirküleri (if şirket)
- [ ] Bank → ticari hesap
- [ ] KEP adresi
- [ ] ETBİS (same week)
- [ ] iyzico production application (submit with live site + legal pages)
- [ ] Muhasebeci engaged

---

## Suggested weekly focus (pre-registration)

### Week 1
- `/tr` homepage + boutique page template
- First conversations with 2–3 boutiques via mom's network
- Draft boutique contract + onboarding checklist

### Week 2
- Cart + checkout UI (sandbox only)
- Curate 5 looks mixing boutique pieces
- Draft TR legal pages (don't publish until operator details final)

### Week 3
- iyzico sandbox end-to-end test
- Collect product data from 1–2 committed boutiques
- Geo middleware + country toggle

### Week 4 (target: vergi levhası)
- Register business
- Publish legal pages with real operator info
- Submit iyzico production
- Soft launch with first boutique

---

## What "ready to launch" looks like before vergi levhası

```
✓ /tr pages built and styled
✓ 3 boutiques verbally committed (vergi levhası confirmed verbally)
✓ 10–20 products photographed and described
✓ 5–10 cross-boutique looks curated
✓ Checkout works in iyzico sandbox
✓ Legal page drafts reviewed (ready to publish)
✓ Boutique contract ready to sign
✓ Kargo options researched (visit branch after registration)

✗ Live payments
✗ ETBİS
✗ Public "Satın Al" on production iyzico
```

When vergi levhası lands, you're **days away from first sale**, not months.

---

## International affiliate — can run in parallel

The international side does **not** require Turkish vergi levhası to **build**, but earning affiliate income as a Turkish resident is still a tax topic for your muhasebeci.

| Task | Pre–vergi levhası? |
|------|---------------------|
| Build lookbook, wardrobe, studio | Yes |
| Publish privacy / terms / affiliate disclosure | Yes |
| Apply to affiliate programs | Yes (personal tax forms) |
| Live tagged affiliate links | Yes (declare income later) |
| TR boutique checkout | No — wait for registration |

See [legal-and-affiliate-compliance.md](./legal-and-affiliate-compliance.md) for international disclosure checklist.

---

## Related docs

- [turkey-shop-roadmap.md](./turkey-shop-roadmap.md) — full TR marketplace launch plan (includes post-registration phases)
- [legal-and-affiliate-compliance.md](./legal-and-affiliate-compliance.md) — affiliate + policy drafts for international side

---

## Revision log

| Date | Change |
|------|--------|
| 2026-07-06 | Initial pre–vergi levhası checklist |
