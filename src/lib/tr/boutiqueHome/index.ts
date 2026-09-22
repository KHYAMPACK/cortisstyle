export type { TrBoutiqueHomeLayoutId } from "@/lib/tr/boutiqueHome/types";
export { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome/registry";
export {
  isAtelierEditorialSkin,
  resolveEditorialSkin,
  type TrEditorialSkinId,
} from "@/lib/tr/boutiqueHome/editorialSkin";
export {
  EDITORIAL_SALE_RED,
  type EditorialCampaignAction,
  type EditorialDemoContent,
  type EditorialHeroPromotion,
  type EditorialNavItem,
  type EditorialTwinStory,
  type EditorialTwinStorySide,
} from "@/lib/tr/boutiqueHome/editorialDemoContent";
export {
  buildBoutiqueEditorialDefaults,
  buildMainCategoryCampaignActions,
  getEditorialContent,
  isBrandHeroTemplate,
  isCampaignHeroTemplate,
  resolveAtelierTwinStory,
  resolveCampaignActions,
  resolveCampaignName,
  resolveCampaignSubText,
  resolveCampaignSubText2,
  resolveEditorialHeroPromotions,
} from "@/lib/tr/boutiqueHome/editorialContent";
