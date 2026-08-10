export type { TrBoutiqueHomeLayoutId } from "@/lib/tr/boutiqueHome/types";
export { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome/registry";
export {
  isAtelierEditorialSkin,
  resolveEditorialSkin,
  type TrEditorialSkinId,
} from "@/lib/tr/boutiqueHome/editorialSkin";
export {
  EDITORIAL_DEMO_SLUG,
  EDITORIAL_SALE_RED,
  getEditorialDemoContent,
  type EditorialCampaignAction,
  type EditorialDemoContent,
  type EditorialHeroPromotion,
  type EditorialNavItem,
} from "@/lib/tr/boutiqueHome/editorialDemoContent";
export {
  buildBoutiqueEditorialDefaults,
  buildMainCategoryCampaignActions,
  getEditorialContent,
  isBrandHeroTemplate,
  isCampaignHeroTemplate,
  resolveCampaignActions,
  resolveCampaignName,
  resolveCampaignSubText,
  resolveCampaignSubText2,
  resolveEditorialHeroPromotions,
} from "@/lib/tr/boutiqueHome/editorialContent";
