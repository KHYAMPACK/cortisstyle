import type { ItemCoordinates, Look, LookItemPlacement } from "@/types/look";
import type { StyleMetrics } from "@/types/style-metrics";

const IMAGE_WIDTH = 1700;
const IMAGE_HEIGHT = 2500;
const GUIDE_PRICE_TL = 349;

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
    title: "Look 04 — Cyber Grunge",
    image: "/images/clothes/outfit-01/temp_image_0AD45B1B-0275-4C7F-817B-E22C2700E090.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
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
    title: "Look 05 — Industrial Poise",
    image: "/images/clothes/outfit-02/ootd236.png",
    modelName: "MARTIN",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
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
    title: "Look 06 — Raw Editorial",
    image: "/images/clothes/outfit-03/ootd237.png",
    modelName: "JAMES",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
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
    title: "Look 01 — Monochrome Silence",
    image: "/images/clothes/outfit-04/ootd278.png",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
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
    title: "Look 02 — Vintage Chic",
    image: "/images/clothes/outfit-05/ootd279.png",
    modelName: "KEONHO",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
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
    title: "Look 03 — Colorful Contrast",
    image: "/images/clothes/outfit-06/ootd266.png",
    modelName: "JAMES",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
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
    title: "Look 07 — Street Style Old Money",
    image: "/images/clothes/outfit-07/ootd281.png",
    modelName: "MARTIN",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
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
  {
    id: "look-08",
    title: "Look 07 — Nocturnal Layer",
    image: "/images/temp_image_7603B699-F9F9-40F3-AF43-8EA5ACD24F72.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Nocturnal / Layered Silk",
      investmentRetail: 4,
      investmentWithGuide: 2,
      versatility: 3,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
    ],
  },
  {
    id: "look-09",
    title: "Look 08 — Concrete Romance",
    image: "/images/temp_image_76EADAD7-87D4-4649-9923-B3D060ACD1BA.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Romantic Brutalism / Drape",
      investmentRetail: 5,
      investmentWithGuide: 3,
      versatility: 3,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
    ],
  },
  {
    id: "look-10",
    title: "Look 10 — Pale Structure",
    image: "/images/temp_image_BA9895CE-E202-4395-A8F9-F1887D40902E.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Pale Structure / Ivory Form",
      investmentRetail: 4,
      investmentWithGuide: 2,
      versatility: 4,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
    ],
  },
  {
    id: "look-11",
    title: "Look 11 — Dissolved Form",
    image: "/images/temp_image_BFD792D8-8457-4412-905C-9FE51B6AA168.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Dissolved Form / Fluid Denim",
      investmentRetail: 4,
      investmentWithGuide: 3,
      versatility: 3,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
    ],
  },
  {
    id: "look-12",
    title: "Look 12 — Final Frame",
    image: "/images/temp_image_F2334FB9-4D25-4EC6-9821-BE54537B0E98.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Classic / Final Frame",
      investmentRetail: 5,
      investmentWithGuide: 2,
      versatility: 5,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
    ],
  },
];

/** Homepage grid order: looks 4–6 first (free), then 1–3 (premium), then the rest. */
const HOMEPAGE_LOOK_ORDER = [
  "look-04",
  "look-05",
  "look-06",
  "look-01",
  "look-02",
  "look-03",
  "look-07",
  "look-08",
  "look-09",
  "look-10",
  "look-11",
  "look-12",
] as const;

const looksById = new Map(ALL_LOOKS.map((look) => [look.id, look]));

export const looks: Look[] = HOMEPAGE_LOOK_ORDER.flatMap((id) => {
  const look = looksById.get(id);
  return look ? [look] : [];
});
