export type {
  TrLookDefinition,
  TrLookStatus,
  TrLookWithProducts,
} from "@/types/tr-look";
export {
  getPublishedTrLookBySlug,
  listPublishedTrLooks,
  safeGetPublishedTrLookBySlug,
  safeListPublishedTrLooks,
  TR_LOOKS_SECTION_ID,
} from "@/lib/tr/looks/list";
export {
  buildTrDemoLooks,
  isTrDemoBoutiqueSlug,
  isTrDemoProduct,
  isTrDemoProductId,
} from "@/lib/tr/looks/demoCatalog";
