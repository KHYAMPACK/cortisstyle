export {
  HERO_OUTFIT_PUBLIC_BASE,
  OUTFIT_FRAME_HEIGHT,
  OUTFIT_FRAME_WIDTH,
  OUTFIT_LANDMARKS,
  OUTFIT_ROLE_PLACEMENTS,
  heroOutfitPublicPath,
} from "@/lib/tr/outfitFrame/types";
export type {
  OutfitAnchorEdge,
  OutfitFrameRole,
  OutfitRolePlacement,
} from "@/lib/tr/outfitFrame/types";
export { normalizeOutfitCutout } from "@/lib/tr/outfitFrame/normalizeOutfitCutout";
export {
  listHeroSlotPublicPaths,
  rewriteHeroSlotPiecesFromDisk,
  writeNormalizedHeroSlot,
} from "@/lib/tr/outfitFrame/heroSlotFs";
