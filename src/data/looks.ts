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

export const looks: Look[] = [
  {
    id: "look-01",
    title: "Look 01 — Cyber Grunge",
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
    id: "look-20",
    title: "Look 02 — Monochrome Silence",
    image: "/images/temp_image_173022D3-DEF3-4AE1-925F-D805072E95B3.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Quiet Luxury / Monochrome",
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
    id: "look-30",
    title: "Look 03 — Raw Editorial",
    image: "/images/temp_image_25420D54-8401-4EA4-9534-08085AA504B3.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Deconstructed / Editorial Raw",
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
    id: "look-04",
    title: "Look 04 — Void Tailoring",
    image: "/images/temp_image_41B4D695-9371-4890-BCEC-26F783029E69.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Architectural / Void Tailoring",
      investmentRetail: 5,
      investmentWithGuide: 3,
      versatility: 4,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
    ],
  },
  {
    id: "look-02",
    title: "Look 02 — Industrial Poise",
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
    id: "look-06",
    title: "Look 06 — Soft Brutalism",
    image: "/images/temp_image_70A042D0-CAC6-4AC8-A1E1-676876DD6FEE.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Soft Brutalism / Minimal Form",
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
    id: "look-07",
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
    id: "look-08",
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
    id: "look-03",
    title: "Look 03 — Raw Editorial",
    image: "/images/clothes/outfit-03/ootd237.png",
    modelName: "SEONGHYEON",
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
