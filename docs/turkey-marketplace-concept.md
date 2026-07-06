# Turkey Marketplace — Concept Overview

A single reference for the **Turkish side** of Cortisstyle (future rebrand: **Lookbook**). This doc explains the idea, who it’s for, how it makes money, and how it fits alongside the existing international lookbook.

> **Disclaimer:** Internal vision doc — not legal or tax advice. Operational and legal steps live in [turkey-shop-roadmap.md](./turkey-shop-roadmap.md) and [pre-vergi-levhasi-checklist.md](./pre-vergi-levhasi-checklist.md).

---

## The idea in one sentence

**A curated outfit marketplace where independent Turkish boutiques get a real storefront on Cortisstyle, and customers can shop full looks made from pieces across multiple boutiques — not just random product grids on Shopier or WhatsApp.**

---

## The problem

Thousands of Turkish fashion boutiques — especially on Instagram — operate like this:

- Sales through **WhatsApp DMs** and manual IBAN transfers
- No real website, or only a generic **Shopier** link
- Products shown in isolation, never as **styled outfits**
- No way to mix a pant from one boutique with a top from another in one experience
- High follower counts (e.g. 100K+) but **high friction** for buyers who won’t DM to purchase

Shopier solves payment. It does **not** solve discovery, curation, cross-store outfit shopping, or brand prestige.

---

## The solution

### 1. Boutique pages

Each onboarded boutique gets a dedicated page:

```
cortisstyle.com/tr/boutique-adi
```

- Personalized storefront (better than a generic Shopier template)
- Their products, their branding, under the Cortisstyle / Lookbook umbrella
- Card payment via **iyzico** — no WhatsApp payment chaos

### 2. Outfit builder (the differentiator)

Boutiques can contribute pieces to **curated looks**. A customer can:

- Browse an editorial outfit (same aesthetic as the international lookbook)
- See pants from Boutique A, top from Boutique B, bag from Boutique C
- Add items to cart and checkout **on Cortisstyle** (one payment flow; items may ship from multiple sellers)

This is **not** what Shopier, Dolap, or Trendyol do well. It’s closer to **editorial lookbook + marketplace**, tuned for Turkish independent fashion.

### 3. Geo-split on one domain

Same brand, same domain, two experiences:

| Visitor | Experience |
|---------|------------|
| **Turkey** | `/tr` — boutique marketplace, TRY, buy on site |
| **International** | Main site — editorial lookbook, affiliate links to US/global retailers |

```
cortisstyle.com        → International (affiliate, unchanged)
cortisstyle.com/tr     → Turkish marketplace
cortisstyle.com/tr/... → Boutiques, shop, checkout
```

No need to throw away international Cortisstyle progress. Content (looks, photography, studio) can serve both markets with different monetization.

---

## Who it’s for

### Sellers (boutiques)

- Independent fashion sellers on Instagram / TikTok
- Already have demand and followers, weak infrastructure
- **Must have vergi levhası** — non-negotiable for onboarding
- Often sell vintage, retro, or curated ready-to-wear (not mass Trendyol sellers)

**Entry wedge:** Founders’ network (e.g. family connections to boutique owners) for first 3–5 partners.

### Buyers

- Turkish customers who want styled fashion, not endless scrolling
- Trust card checkout over DM + IBAN
- Willing to pay for curation and context (“how this piece works in a look”)

---

## What we are NOT doing

| Rejected idea | Why |
|---------------|-----|
| **Dropshipping from Zara / Trendyol** | Violates retailer ToS, thin margins, return nightmare, you’re not the seller |
| **Buying after customer orders** | Same problems; legally and operationally fragile |
| **Shopier clone** | Commodity — we compete on **outfits + curation + traffic**, not “another payment link” |
| **Own payment infrastructure** | Use **iyzico**; we build the platform, not a bank |
| **Onboarding boutiques without vergi levhası** | Legal and trust risk |

**Optional later:** Founders’ own vintage inventory on the platform — but the core vision is **multi-boutique marketplace**, not solo resale only.

---

## Business model

### Revenue streams

| Stream | Description |
|--------|-------------|
| **Commission per sale** | Primary — e.g. 12–15% at launch (boutiques only see this one number) |
| **Monthly fee** | Optional — for boutiques that want outfit-builder placement + premium page (add after traction) |
| **Featured looks** | Later — paid homepage / “look of the week” placement |
| **Setup fee** | Optional one-time for photography, page setup, first looks |

### Payment stack (conceptual)

```
Customer pays 1000 TL
    → iyzico processes card (~3–4% — our backend cost, not shown to boutique as separate line)
    → Platform keeps commission (e.g. 15% = 150 TL)
    → Boutique receives remainder (e.g. 850 TL)
```

**Pitch to boutiques:** One number — *“We take X%. You get the rest. We handle site, payment, and orders.”*

**Do not pitch:** “Cheaper than Shopier.” Shopier’s fee is lower; we charge for **sales, discovery, and outfit context**.

### Early launch pricing (suggested)

- **Months 1–3:** Commission only, no monthly fee, free setup for first 3–5 boutiques
- **After proof:** Monthly fee for outfit-builder tier; or commission-only for storefront-only tier

---

## How orders work (v1)

1. Customer builds cart (possibly items from multiple boutiques)
2. Single checkout on Cortisstyle (iyzico)
3. Order split into line items per boutique
4. Each boutique ships their own pieces
5. Platform notifies boutiques; manual payout to boutiques weekly (automated split via iyzico pazaryeri later)
6. Returns: **14-day cayma hakkı** — boutique handles return; platform facilitates in UI/support

**Honest limitation:** Multi-boutique outfit = possibly **multiple packages**. That’s acceptable at launch; consolidation is a later problem.

---

## Legal role (high level)

| Role | Party |
|------|--------|
| **Seller to consumer** | Boutique (with vergi levhası) |
| **Platform / aracı hizmet sağlayıcı** | Cortisstyle / Lookbook operator |
| **Payment processor** | iyzico |

Requires: vergi levhası, ETBİS, mesafeli satış, ön bilgilendirme, iade policy, boutique contracts, KVKK. Details: [turkey-shop-roadmap.md](./turkey-shop-roadmap.md).

**International affiliate** on the main site does **not** conflict — different legal mode (outbound links vs on-site sales). Keep routes and checkout flows separate.

---

## Competitive landscape (Turkey)

| Platform | Strength | Gap we fill |
|----------|----------|-------------|
| **Shopier** | Fast setup, payment | No outfit curation, no cross-store looks, generic pages |
| **Dolap** | Volume, C2C | Chaotic, no editorial, race to bottom |
| **Trendyol** | Mass retail | Not boutique / vintage / curated |
| **Instagram DM** | Free | No trust, no card, no discovery |
| **Cortisstyle TR** | Outfit-first marketplace + boutique pages + iyzico | New — must prove traffic and sales |

**Moat:** Editorial lookbook UX + studio tooling + selective boutique network — not lowest commission.

---

## Relationship to current Cortisstyle

What already exists and maps to this vision:

| Existing asset | TR marketplace use |
|----------------|-------------------|
| Look / outfit data model | Cross-boutique looks |
| Look modal + item breakdown | “Shop this piece” per boutique |
| Studio | Curators compose looks from boutique inventory |
| Supabase auth | Optional buyer accounts; seller data later |
| Legal page patterns | Extend with TR-specific docs |
| Vercel + middleware | Geo routing to `/tr` |

What’s new: boutique entities, product inventory, cart, checkout, iyzico, orders, boutique contracts, seller notifications.

---

## Growth path

```
Phase 1 — Prove the model
  3–5 boutiques (network introductions)
  10–20 cross-boutique looks
  Manual payouts, email order alerts
  Commission-only pricing

Phase 2 — Destination
  More boutiques apply or get invited
  Outfit builder as core discovery
  Featured looks, social content (TikTok / IG TR)

Phase 3 — Platform
  iyzico marketplace auto-split
  Seller dashboard
  Stricter curation (quality over quantity)
  Optional rebrand to Lookbook (lookbook.com)
```

**North star:** The curated place for Turkish vintage / independent fashion — **Depop-meets-editorial**, not another Shopier link.

---

## Branding note

- **Now:** Build and launch as **Cortisstyle** on `cortisstyle.com/tr`
- **Later:** Rebrand to **Lookbook** when `lookbook.com` is acquired and revenue justifies it
- Register **vergi levhası** when TR sales go live; ticari unvan can be updated when rebranding (annoying but doable)

Don’t let naming block execution. Ship the marketplace first.

---

## Key principles

1. **Only boutiques with vergi levhası** — no exceptions  
2. **Signed contract before listing**  
3. **Outfit-first, not grid-first** — curation is the product  
4. **One commission number for boutiques** — hide iyzico as platform cost  
5. **Separate TR commerce from international affiliate** — same domain, different paths  
6. **Start manual, automate later** — payouts, returns, seller tools  
7. **Mom’s network = distribution** — first boutiques matter more than perfect code  

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [turkey-shop-roadmap.md](./turkey-shop-roadmap.md) | Phased launch plan (legal, build, growth) |
| [pre-vergi-levhasi-checklist.md](./pre-vergi-levhasi-checklist.md) | What to build before vergi levhası |
| [legal-and-affiliate-compliance.md](./legal-and-affiliate-compliance.md) | International affiliate policies |

---

## Revision log

| Date | Change |
|------|--------|
| 2026-07-06 | Initial concept overview |
