# Agent handoffs — Cortisstyle

Start here when picking up this repo. One doc per subsystem — open the one that matches your task, not the whole set. Each doc's "Related" section points to its neighbors, so you rarely need to read more than 1-2 to get oriented.

| Doc | Subsystem |
|---|---|
| [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md) | Tenant model, domain routing, onboarding a new boutique |
| [04-storefront-editorial-home.md](./04-storefront-editorial-home.md) | Public boutique storefront — home layouts, editorial skins, category browsing, PDP |
| [05-owner-panel-commerce.md](./05-owner-panel-commerce.md) | Owner panel, checkout, orders, shipping, payments |
| [06-fashion-module.md](./06-fashion-module.md) | The garment/apparel vertical (`catalog_profile = "fashion"`) and the core/module boundary rule |
| [07-custom-art-module.md](./07-custom-art-module.md) | The print-on-demand vertical (`catalog_profile = "custom_art"`) and the capability-flag pattern |
| [08-ai-catalog-pipeline.md](./08-ai-catalog-pipeline.md) | AI-assisted listing creation — Gemini drafts, FASHN try-on/packshot, Photoroom bg removal |
| [09-cadde-marketplace.md](./09-cadde-marketplace.md) | The cross-boutique "Cadde" marketplace surface (distinct from a single boutique's storefront) |
| [10-boutique-design-inspiration.md](./10-boutique-design-inspiration.md) | External reference sites for boutique visual direction |
| [11-platform-ops.md](./11-platform-ops.md) | Edge proxy, auth, scripts, env vars, Supabase, the fashion/core lint boundary |
| [01-international-lookbook.md](./01-international-lookbook.md) | **Archived** — this surface now ships from sibling repo `cortisstyle-international` |
| [02-lookbook-studio.md](./02-lookbook-studio.md) | **Archived** — same as above; one file (`photoroomRemoveBg.ts`) stayed in this repo |

Also relevant, outside this directory: [../lila-butik-e-ticaret-setup.md](../lila-butik-e-ticaret-setup.md) (shared commerce rails + editorial skins background), [../tr-boutique-legal-templates.md](../tr-boutique-legal-templates.md) (yasal template pack).

**Agents:** these docs are meant to be true, not historical — when you change something a doc describes, update that doc in the same change, not as a follow-up. If a doc no longer matches the code, fix it or delete it; don't leave it to rot as the next reader's problem.
