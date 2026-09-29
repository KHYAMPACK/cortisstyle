# Cortisstyle

**A multi-tenant e-commerce platform for Turkish boutiques.** Each boutique gets its own storefront, custom domain, owner panel, payments and shipping, all running on one shared codebase.

🌐 [cortisstyle.com](https://www.cortisstyle.com) · First live store: [Lila Butik](https://lilaboutiquedenizli.com)

> Built and run solo by [Mert Ekiz](https://github.com/KHYAMPACK) / [Ekiz Yazılım](https://ekizyazilim.com).

---

## What it is

Cortisstyle started as a single fashion store and grew into shared infrastructure that Ekiz Yazılım uses to onboard boutiques as clients. Instead of building every shop from scratch, a new boutique is created as a **tenant**: it gets its own branding, catalog, domain and payment account, and runs on the same commerce engine as the others.

The goal is to cut the time from "the boutique says yes" to "the store is live" from about two weeks to one or two days, and eventually to offer self-serve signup, similar to ikas or ideasoft.

## Features

**Storefront**
- Multi-tenant routing: `/tr/[boutiqueSlug]` plus custom domains per boutique
- Editorial home layouts and skins, category browsing, product detail pages with variants, sizes and stock
- Cart and checkout with Turkish invoice, tax and consent fields (KVKK, distance sales agreement)
- Customer accounts, saved addresses, discount codes
- SEO: per-product metadata, sitemaps, Google Merchant feed

**Owner panel** (`/tr/panel`)
- Products, stock, orders, manual orders and drafts, customers, discounts, campaigns, invoices, reports and settings
- Web push notifications to the owner for new orders
- Shipping labels and fulfilment tracking

**Payments and shipping**
- **iyzico** Checkout Form, with per-boutique encrypted credentials
- **Basit Kargo** integration for shipping quotes and shipments
- Transactional email through **Resend**

**AI catalog pipeline**
- AI-drafted product listings (Gemini)
- Virtual try-on and packshots (FASHN), background removal (Photoroom)

**Architecture**
- Core commerce engine plus vertical modules: `fashion` and `custom_art` (print-on-demand), with a lint-enforced module boundary
- Tooling scripts to onboard a new boutique (`scripts/create-boutique.mts`)

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling / motion | Tailwind CSS, Framer Motion |
| Data / auth | Supabase (Postgres, Auth, Storage, RLS) |
| State | Zustand |
| Editor | Tiptap (rich text in the owner panel) |
| Payments | iyzico |
| Shipping | Basit Kargo |
| Email / push | Resend, Web Push |
| Images | Sharp |
| Hosting | Vercel (Analytics and Speed Insights) |

## Project layout

```
src/app/tr/[boutiqueSlug]   public boutique storefronts
src/app/tr/panel            owner panel
src/app/api/tr              checkout, shipping, owner and admin APIs
src/lib/tr/*                commerce core (orders, payments, shipping, catalog, seo, ai…)
supabase/                   schema.sql + incremental SQL patches
scripts/                    boutique onboarding and maintenance scripts
docs/                       roadmap, onboarding plans, subsystem handoff docs
```

Internal docs start at [`docs/agent-handoffs/README.md`](docs/agent-handoffs/README.md) and [`docs/platform-roadmap.md`](docs/platform-roadmap.md).

## Local development

```bash
npm install
cp .env.example .env.local   # Supabase, iyzico, Resend keys, etc.
npm run dev
```

## Status

The platform and first client store are live, and more boutiques are being onboarded. Current work is on faster assisted onboarding. Self-serve signup and billing come next.
