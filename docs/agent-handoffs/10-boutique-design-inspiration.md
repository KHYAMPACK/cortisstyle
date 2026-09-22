# 10 — Boutique design inspiration + storefront templates

**Purpose:** External reference sites for boutique storefront UI/UX. Use when designing or refining `/tr/[slug]` editorial homes, PLPs, PDPs, and brand presence — not when onboarding a new boutique (that's [03-multi-tenant-boutiques.md](./03-multi-tenant-boutiques.md)).

## Storefront templates (standards)

When an agent is asked to **create a site for a boutique**, pick one of these **standard templates**. Open the live site and ship principles through boutique home/PDP **registries** — do not pixel-clone.

**Important:** `standard1` / `standard2` / `standard3` are **template IDs only — not priority**. None is “better” or the default by number. Choose the template that fits **what the boutique sells** and its brand vibe (e.g. sport/performance merch vs quiet fashion grid vs casual lifestyle basics).

| ID | Name | URL | Fits well when… |
|----|------|-----|------------------|
| **standard1** / **template1** | Balmoral Running | https://www.balmoralrunning.com/ | Collection-led, premium athletic / considered merch storytelling |
| **standard2** / **template2** | Cecilie Bahnsen | https://ceciliebahnsen.com/ | Clean/simple fashion structure; spacious image-first PLP |
| **standard3** / **template3** | Marine Layer | https://www.marinelayer.com/ | Casual lifestyle / soft basics; seasonal campaign home, him/her entry, approachable commerce |

- If the user names an ID or brand (“standard3”, “Marine Layer”) → use that template.
- If they ask for a boutique site with no template named → **ask or infer from catalog** (what they sell, photography style, price tier) and pick the matching standard. Do not default to a lower number.
- Brand assets, copy, and catalog stay the boutique’s — only layout/rhythm/chrome principles come from the template.

### Template 1 — Balmoral Running (standard1)

- **URL:** https://www.balmoralrunning.com/
- **Focus:** whole site — home, collections, product presentation, editorial sections.
- **What we like (study this):**
  - General design of the site as a full boutique storefront language
  - Clear collection storytelling (sectioned merchandising, lookbook-adjacent blocks)
  - Considered, premium commerce UI without noisy promo chrome

### Template 2 — Cecilie Bahnsen (standard2)

- **URL:** https://ceciliebahnsen.com/
- **Focus pages:** main/home and products (PLP).
- **What we like (study this):**
  - Site structure — clear, restrained IA (nav, category, filters) that stays out of the way of the clothes
  - Main page — clean and simple; brand and imagery lead, low visual noise
  - Products page — spacious grid, large portrait photography, minimal overlays, little grid clutter; filter/sort as text
  - Overall feel — white/monochrome calm; serif brand mark + quiet sans UI

### Template 3 — Marine Layer (standard3)

- **URL:** https://www.marinelayer.com/
- **Focus:** whole site — seasonal home campaigns, category entry (him/her), product storytelling.
- **What we like (study this):**
  - Approachable lifestyle commerce layout — campaign headline + short support + clear shop paths
  - Seasonal merchandising blocks (e.g. “cooler side of summer”, transitional dresses, hero product stories)
  - Soft, everyday brand tone that still feels designed — good fit for casual / basics boutiques

## How agents should use other references

- Open or fetch the live URL; prefer **What we like** notes.
- Extract **principles** only. Do **not** copy assets, trademarks, or implement a pixel clone.
- Stay inside Cortisstyle patterns: boutique home/PDP registries, existing TR components, `.cursor/rules` design guidance.
- Sites below are **inspiration accents** (poses, type, PDP), not full-site standards — unless the owner says otherwise.

## Inspiration accents (not full-site templates)

### Roberto Collina

- **URL:** https://www.robertocollina.it/
- **Focus pages:** product listing / product detail (PDP).
- **What we like (study this):**
  - How products are displayed on product pages
  - Model poses — natural, garment-forward presentation
  - Photography / framing that sells the product through the model

### Serotoninn

- **URL:** https://serotoninn.com/
- **Focus pages:** homepage / campaign hero.
- **What we like (study this):**
  - Typography — bold condensed display vs small clean UI sans
  - Model poses — full-figure, centered, garment-forward
- Cadde `/tr` campaign hero (`CaddeSplitHero`) uses this split language — two poses, not four.

## Adding sites

- To promote a site to a **template**, add it under **Storefront templates** with the next standard/template ID and a short “fits well when…” note. IDs are labels only — not rank.
- For accents only, add under **Inspiration accents** with **What we like**.
