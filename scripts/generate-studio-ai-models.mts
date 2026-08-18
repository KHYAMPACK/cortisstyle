/**
 * Studio / house model plates are one-time Cursor image gens.
 * FASHN is packshot + try-on only — do not call model-create.
 *
 * Existing files: public/tr/ai-models/studio-ayla.jpg, studio-deniz.jpg,
 * lilabutik-lila-*.jpg (see LILABUTIK_LILA_TRYON_REFS).
 */
console.error(
  "Do not use FASHN model-create. Generate plates in Cursor, copy into public/tr/ai-models/, then list them in src/lib/tr/aiModel/registry.ts.",
);
process.exit(1);
