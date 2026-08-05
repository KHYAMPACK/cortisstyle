/**
 * Server-only content pack persistence + generation (service role, FASHN, etc.).
 * Do not import from client components — use `@/lib/tr/contentPacks` for UI-safe bits.
 */

export {
  createContentPackAdmin,
  getContentPackByIdAdmin,
  listContentPacksByBoutiqueIdAdmin,
  mapContentPackRow,
} from "@/lib/tr/contentPacks/persist";

export {
  generateContentPackForProduct,
  type GenerateContentPackResult,
} from "@/lib/tr/contentPacks/generate";
