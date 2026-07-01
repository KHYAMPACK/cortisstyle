import type { ItemCoordinates, Look, LookItemPlacement } from "@/types/look";
import type { StyleMetrics } from "@/types/style-metrics";
import {
  buildLooksById,
  getDynamicCatalog,
  mergeHomepageLookOrder,
  resolveLooksStream,
} from "@/lib/dynamicLooks/registry";

const IMAGE_WIDTH = 1700;
const IMAGE_HEIGHT = 2500;

function leader(
  fromTop: string,
  fromLeft: string,
  toTop: string,
  toLeft: string,
): ItemCoordinates {
  return {
    from: { top: fromTop, left: fromLeft },
    to: { top: toTop, left: toLeft },
  };
}

function placement(
  itemId: string,
  fromTop: string,
  fromLeft: string,
  toTop: string,
  toLeft: string,
): LookItemPlacement {
  return {
    itemId,
    coordinates: leader(fromTop, fromLeft, toTop, toLeft),
  };
}

function metrics(data: StyleMetrics): StyleMetrics {
  return data;
}

const ALL_LOOKS: Look[] = [
  {
    id: "look-01",
    title: "Cyber Grunge",
    image: "/images/clothes/outfit-01/temp_image_0AD45B1B-0275-4C7F-817B-E22C2700E090.WEBP",
    modelName: "SEONGHYEON",
    layout: "collage",
    outfitId: "outfit-01",
    editorGuideImage:
      "/images/clothes/outfit-01/temp_image_0AD45B1B-0275-4C7F-817B-E22C2700E090.WEBP",
    ...metrics({
      vibe: "Avant-Garde / Cyber Grunge",
      investmentRetail: 5,
      investmentWithGuide: 2,
      versatility: 5,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("black-beanie-01", "10.2%", "32.4%", "5.7%", "47.8%"),
      placement("compression-shirt-01", "36%", "48%", "40%", "20%"),
      placement("bootcut-jeans-02", "54.0%", "41.2%", "54%", "16%"),
      placement("black-sunglasses-01", "23.5%", "20.8%", "17.2%", "15.7%"),
      placement("sneakers-01", "76.8%", "17.4%", "68.2%", "21.2%"),
      placement("black-bag-01", "62.5%", "78.6%", "73.2%", "79.2%"),
    ],
  },
  {
    id: "look-02",
    title: "Industrial Poise",
    image: "/images/clothes/outfit-02/ootd236.png",
    modelName: "MARTIN",
    layout: "collage",
    outfitId: "outfit-02",
    editorGuideImage:
      "/images/clothes/outfit-02/temp_image_BFD792D8-8457-4412-905C-9FE51B6AA168.WEBP",
    ...metrics({
      vibe: "Industrial / Utility Poise",
      investmentRetail: 4,
      investmentWithGuide: 2,
      versatility: 5,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("sunglasses-02", "20%", "48%", "14%", "62%"),
      placement("necklace-01", "20%", "48%", "14%", "62%"),
      placement("longsleeve-shirt-01", "54%", "42%", "48%", "28%"),
      placement("shorts-01", "70%", "48%", "76%", "58%"),
      placement("black-bag-02", "70%", "48%", "76%", "58%"),
      placement("sneakers-02", "70%", "48%", "76%", "58%"),
    ],
  },
  {
    id: "look-03",
    title: "Raw Editorial",
    image: "/images/clothes/outfit-03/ootd237.png",
    modelName: "JAMES",
    layout: "collage",
    outfitId: "outfit-03",
    editorGuideImage:
      "/images/clothes/outfit-03/ootd237.png",
    ...metrics({
      vibe: "Deconstructed / Editorial Raw",
      investmentRetail: 4,
      investmentWithGuide: 2,
      versatility: 3,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("tank-top-01", "54%", "42%", "48%", "28%"),
      placement("baggy-jeans-01", "70%", "48%", "76%", "58%"),
      placement("bracelet-01", "70%", "48%", "76%", "58%"),
      placement("sneakers-03", "70%", "48%", "76%", "58%"),
      placement("sunglasses-01", "70%", "48%", "76%", "58%"),
      placement("cap-01", "70%", "48%", "76%", "58%"),
      placement("necklace-02", "70%", "48%", "76%", "58%"),
      placement("teal-bag-01", "70%", "48%", "76%", "58%"),
    ],
  },
  {
    id: "look-04",
    title: "Monochrome Silence",
    image: "/images/clothes/outfit-04/ootd278.png",
    modelName: "JUHOON",
    layout: "collage",
    outfitId: "outfit-04",
    editorGuideImage:
      "/images/clothes/outfit-04/ootd278.png",
    ...metrics({
      vibe: "Quiet Luxury / Monochrome",
      investmentRetail: 4,
      investmentWithGuide: 2,
      versatility: 5,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("ember-top-black-01", "54%", "42%", "48%", "28%"),
      placement("studded-oversized-tote-bag-01", "70%", "48%", "76%", "58%"),
      placement("js-eyewear-5052-sunglasses-01", "70%", "48%", "76%", "58%"),
      placement("gray-raw-denim-jacket-01", "70%", "48%", "76%", "58%"),
      placement("tweed-mini-skirt-with-decorative-belt-01", "70%", "48%", "76%", "58%"),
      placement("wide-heeeled-boots-01", "70%", "48%", "76%", "58%"),
    ],
  },
  {
    id: "look-05",
    title: "Vintage Chic",
    image: "/images/clothes/outfit-05/ootd279.png",
    modelName: "KEONHO",
    layout: "collage",
    outfitId: "outfit-05",
    editorGuideImage:
      "/images/clothes/outfit-05/ootd279.png",
    ...metrics({
      vibe: "Vintage Chic / Chic Retro",
      investmentRetail: 5,
      investmentWithGuide: 3,
      versatility: 3,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("polo-ralph-lauren-women-s-shirt-01", "54%", "42%", "48%", "28%"),
      placement("obosoyo-minimalist-burgundy-faux-leather-tote-ba-01", "70%", "48%", "76%", "58%"),
      placement("the-miu-miu-bayonetta-glasses-01", "70%", "48%", "76%", "58%"),
      placement("hollister-co-women-s-black-and-navy-shorts-01", "70%", "48%", "76%", "58%"),
      placement("women-s-tan-cream-coat-01", "70%", "48%", "76%", "58%"),
      placement("zava-black-suede-ballerina-01", "70%", "48%", "76%", "58%"),
    ],
  },
  {
    id: "look-06",
    title: "Colorful Contrast",
    image: "/images/clothes/outfit-06/ootd266.png",
    modelName: "JAMES",
    layout: "collage",
    outfitId: "outfit-06",
    editorGuideImage:
      "/images/clothes/outfit-06/ootd266.png",
    ...metrics({
      vibe: "Colorful Contrast / Vibrant",
      investmentRetail: 5,
      investmentWithGuide: 3,
      versatility: 4,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("women-s-green-and-blue-vest-01", "54%", "42%", "48%", "28%"),
      placement("perfect-denims-01", "70%", "48%", "76%", "58%"),
      placement("women-s-brown-belt-01", "70%", "48%", "76%", "58%"),
      placement("women-s-brown-ballet-shoes-01", "70%", "48%", "76%", "58%"),
      placement("bright-yellow-bag-01", "70%", "48%", "76%", "58%"),
      placement("women-s-brown-and-silver-sunglasses-01", "70%", "48%", "76%", "58%"),
      placement("burn-mark-zip-up-hoodi-01", "70%", "48%", "76%", "58%"),
    ],
  },
  {
    id: "look-07",
    title: "Street Style Old Money",
    image: "/images/clothes/outfit-07/ootd281.png",
    modelName: "MARTIN",
    layout: "collage",
    outfitId: "outfit-07",
    editorGuideImage:
      "/images/clothes/outfit-07/ootd281.png",
    ...metrics({
      vibe: "Street Style Old Money / Minimal Form",
      investmentRetail: 4,
      investmentWithGuide: 2,
      versatility: 4,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("linen-cotton-blend-striped-shirt-01", "54%", "42%", "48%", "28%"),
      placement("glass-piece-necklaces-01", "70%", "48%", "76%", "58%"),
      placement("verydior-m1u-wrap-around-acetate-sunglasses-01", "70%", "48%", "76%", "58%"),
      placement("scallop-shoulder-bag-01", "70%", "48%", "76%", "58%"),
      placement("black-soft-knee-length-wide-leg-jorts-01", "70%", "48%", "76%", "58%"),
      placement("label-knit-wool-leg-warmers-01", "70%", "48%", "76%", "58%"),
      placement("v-neck-racerback-tank-01", "70%", "48%", "76%", "58%"),
      placement("women-s-black-ballet-shoes-01", "70%", "48%", "76%", "58%"),
    ],
  },
];

/** Homepage grid order: looks 4–6 first, then 1–3, then 7. */
const HOMEPAGE_LOOK_ORDER = [
  "look-04",
  "look-05",
  "look-06",
  "look-01",
  "look-02",
  "look-03",
  "look-07",
] as const;

export const LEGACY_LOOKS: Look[] = ALL_LOOKS;

export const LEGACY_HOMEPAGE_LOOK_ORDER: readonly string[] = HOMEPAGE_LOOK_ORDER;

let looksCache: Look[] | null = null;

function resolveLooks(): Look[] {
  const dynamic = getDynamicCatalog();
  const looksById = buildLooksById(LEGACY_LOOKS, dynamic.looks);
  const order = mergeHomepageLookOrder(
    LEGACY_HOMEPAGE_LOOK_ORDER,
    dynamic.lookOrderAdditions,
  );

  return resolveLooksStream(order, looksById);
}

/** Rebuild look stream after server-side disk crawl (see buildCatalogFromDisk). */
export function refreshLooksRegistry(): void {
  looksCache = null;
}

/** Homepage + modal look stream (legacy hardcoded + dynamic JSON imports). */
export function getLooks(): Look[] {
  if (!looksCache) {
    looksCache = resolveLooks();
  }

  return looksCache;
}
