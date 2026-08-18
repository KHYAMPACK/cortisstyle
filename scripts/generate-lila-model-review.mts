/**
 * Lila plates are already wired (Cursor gens, no waist-up).
 * FASHN is packshot + try-on only — do not regenerate via model-create.
 */
console.error(
  "Lila try-on plates live in public/tr/ai-models/lilabutik-lila-*.jpg and registry LILABUTIK_LILA_TRYON_REFS. Do not call FASHN model-create.",
);
process.exit(1);
