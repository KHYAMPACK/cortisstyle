# 08 — AI catalog pipeline (**PARKED**)

**Status (2026-09-30):** parked, not deleted. Mert chose to build a clean data model first (`docs/foundation-no-hardcode-plan.md`) and bring AI back afterwards as a layer on top of it.

- **The code** (Gemini listing drafts, FASHN packshot + try-on, Photoroom background removal, house models, restyle, credits) is intact at commit **`8aba2be`** on `main`, the last commit that ran it.
- **What it did and how, the prompts, providers, env vars, costs and lessons:** `docs/ai-pipeline-v1.md`.
- **How it comes back:** §7 of `docs/foundation-no-hardcode-plan.md`. It returns as a client of the product API that proposes photos and text for the owner to accept, with house models and settings as data, and one job queue.

**What's in the running code instead:**

- Products are added by hand: the wizard, Toplu ekle and Takım upload the owner's photos as they are, and save `features.manualListing = true`.
- Photos made by the AI earlier stay on their products and in the shop. `catalog/productImages.ts` still knows how to show a packshot / model-shot gallery.
- The fashion editor shows that gallery read-only, with "Fotoğrafları düzenle" to turn it into a plain photo list.
- `tr_ai_usage_events` and `features.aiModelId` stay in the database. The PDP's model measurements line (`fashion/modelMeasurements.ts`) still reads `aiModelId`.
- The env vars (`FASHN_*`, `PHOTOROOM_API_KEY`, `GEMINI_*` / `OPENAI_*`) can stay set; nothing reads them.

## Related

- Fashion module: [06-fashion-module.md](./06-fashion-module.md)
- Owner panel: [05-owner-panel-commerce.md](./05-owner-panel-commerce.md)
