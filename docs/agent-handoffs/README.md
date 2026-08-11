# Agent handoffs — Cortisstyle

Start here when picking up this repo. Read **[00-overview.md](./00-overview.md)** first, then only the section that matches your task.

| Doc | Business phase | When to open |
|-----|----------------|--------------|
| [00-overview.md](./00-overview.md) | All | Every new agent session that touches product work |
| [01-international-lookbook.md](./01-international-lookbook.md) | Adjacent / US traffic | `/`, `/wardrobe`, affiliate, dynamic looks |
| [02-lookbook-studio.md](./02-lookbook-studio.md) | Content ops (feeds all phases) | `studio/`, `/api/studio`, collage tooling |
| [03-boutique-storefronts.md](./03-boutique-storefronts.md) | **Phase 1** — boutique sites | `/tr/[slug]`, custom domains, owner panel catalog |
| [04-tr-marketplace.md](./04-tr-marketplace.md) | **Phase 2** — multi-tenant pazaryeri | `/tr` Cadde, looks, platform cart |
| [05-commerce-rails.md](./05-commerce-rails.md) | Shared by 1+2 | Checkout, orders, WhatsApp interim, payments |
| [06-sell-enablement.md](./06-sell-enablement.md) | **Phase 3** — help them sell | AI catalog, campaigns, TikTok/affiliate growth |
| [07-platform-ops.md](./07-platform-ops.md) | Cross-cutting | Env, Supabase patches, auth, conventions |
| [08-boutique-audit-pervin.md](./08-boutique-audit-pervin.md) | Phase 1 health check | Pervin Soysal Butik: what works, holes, panel truth |
| [09-boutique-clone-playbook.md](./09-boutique-clone-playbook.md) | Phase 1 onboarding | Copy the **system** (not UI) for the next boutique |
| [10-boutique-design-inspiration.md](./10-boutique-design-inspiration.md) | Phase 1 visual direction | Boutique **templates** (IDs not priority): 1 Balmoral, 2 Cecilie, 3 Marine Layer + accents |
| [11-cortisstyle-design-inspiration.md](./11-cortisstyle-design-inspiration.md) | Cortisstyle (not boutiques) | Lookbook / AI discovery UX references |
| [12-boutique-go-live.md](./12-boutique-go-live.md) | Phase 1 launch | Payment modes (pending/sandbox/iyzico), secrets |
| [13-boutique-wire-in-and-go-live.md](./13-boutique-wire-in-and-go-live.md) | Phase 1 onboarding | **Wire-in registry** + **pre-live checklist** (use for next boutique) |
| [lila-butik-e-ticaret-setup.md](../lila-butik-e-ticaret-setup.md) | Phase 1 architecture | Shared rails + Lila `atelier` editorial skin |
| [tr-boutique-legal-templates.md](../tr-boutique-legal-templates.md) | Phase 1 legal | Shared yasal sözleşme taslakları (placeholders → `src/lib/tr/legal/docs.ts`) |

Deeper vision/roadmap (not handoffs): `docs/turkey-marketplace-concept.md`, `docs/turkey-shop-roadmap.md`, `docs/lookbook-studio-integration.md`.

**Agents:** after structural changes, update the matching doc (see `.cursor/rules/document-structural-changes.mdc`).
