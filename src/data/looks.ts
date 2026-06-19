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
    image: "/images/temp_image_0AD45B1B-0275-4C7F-817B-E22C2700E090.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    layout: "collage",
    outfitId: "outfit-01",
    editorGuideImage:
      "/images/clothes/outfit-01/temp_image_0AD45B1B-0275-4C7F-817B-E22C2700E090.WEBP",
    modelPortraitPosition: {
      top: "6%",
      left: "52%",
      width: "42%",
      zIndex: 1,
    },
    modelNamePosition: {
      top: "60%",
      left: "52%",
      fontSizePx: 100,
      zIndex: 1,
    },
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
      placement("oversized-wool-overcoat-01", "20%", "48%", "14%", "62%"),
      placement("raw-hem-trousers-01", "52%", "42%", "48%", "28%"),
      placement("sculpted-leather-belt-01", "70%", "48%", "76%", "58%"),
    ],
  },
  {
    id: "look-03",
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
      placement("deconstructed-blazer-01", "24%", "42%", "18%", "32%"),
      placement("sheer-panel-shirt-01", "48%", "48%", "42%", "22%"),
      placement("stacked-silver-rings-01", "36%", "58%", "28%", "68%"),
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
      placement("double-breasted-suit-jacket-01", "22%", "46%", "16%", "30%"),
      placement("wide-leg-pleated-pants-01", "58%", "42%", "52%", "24%"),
      placement("patent-oxford-shoes-01", "78%", "46%", "86%", "38%"),
    ],
  },
  {
    id: "look-05",
    title: "Look 05 — Industrial Poise",
    image: "/images/temp_image_5CAF4EFB-6498-4A2F-9DE7-D1F4BFEE885F.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Industrial / Utility Poise",
      investmentRetail: 4,
      investmentWithGuide: 2,
      versatility: 5,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("utility-cargo-vest-01", "18%", "48%", "10%", "64%"),
      placement("ribbed-tank-layer-01", "44%", "40%", "38%", "22%"),
      placement("steel-toe-ankle-boots-01", "74%", "44%", "82%", "30%"),
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
      placement("concrete-grey-knit-01", "26%", "40%", "18%", "24%"),
      placement("structured-canvas-trousers-01", "55%", "44%", "48%", "18%"),
      placement("minimalist-crossbody-bag-01", "52%", "64%", "44%", "82%"),
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
      placement("midnight-silk-shirt-01", "21%", "44%", "14%", "28%"),
      placement("layered-chain-necklace-01", "34%", "52%", "26%", "68%"),
      placement("suede-chelsea-boots-01", "76%", "46%", "84%", "22%"),
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
      placement("asymmetric-draped-top-01", "23%", "48%", "16%", "32%"),
      placement("floor-length-wool-skirt-01", "60%", "42%", "54%", "20%"),
      placement("sculpted-heeled-mules-01", "82%", "48%", "90%", "62%"),
    ],
  },
  {
    id: "look-09",
    title: "Look 09 — Static Motion",
    image: "/images/temp_image_95DC569E-5870-49FD-B619-26156683DFAC.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    guidePrice: GUIDE_PRICE_TL,
    ...metrics({
      vibe: "Athletic / Static Motion",
      investmentRetail: 4,
      investmentWithGuide: 2,
      versatility: 5,
    }),
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: [
      placement("motion-print-windbreaker-01", "19%", "50%", "12%", "66%"),
      placement("tapered-nylon-joggers-01", "50%", "42%", "44%", "24%"),
      placement("reflective-runner-sneakers-01", "70%", "44%", "78%", "34%"),
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
      placement("ivory-structured-blouse-01", "25%", "38%", "18%", "22%"),
      placement("pale-linen-trousers-01", "54%", "46%", "48%", "18%"),
      placement("pearl-drop-earrings-01", "30%", "56%", "22%", "72%"),
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
      placement("liquid-drape-cardigan-01", "16%", "46%", "10%", "30%"),
      placement("faded-wide-denim-01", "62%", "40%", "56%", "18%"),
      placement("translucent-frame-sunglasses-01", "22%", "54%", "14%", "72%"),
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
      placement("statement-trench-coat-01", "18%", "36%", "12%", "20%"),
      placement("monogram-silk-scarf-01", "40%", "50%", "32%", "68%"),
      placement("polished-leather-loafers-01", "75%", "46%", "84%", "28%"),
    ],
  },
];
