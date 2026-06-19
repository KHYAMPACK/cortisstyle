import type { ClothingCategory, ClothingItem } from "@/types/item";

const REVEAL_VENUES = [
  "Cortis Archive Seoul",
  "Garosu-gil Concept Store",
  "Dongdaemun Vintage Market",
  "Itaewon Antiquity Lane",
  "Hanam Vintage Depot",
  "Apgujeong Private Sale",
];

function revealDescription(blurredDescription: string): string {
  let index = 0;
  return blurredDescription.replace(
    /\[BLURRED\]/g,
    () => REVEAL_VENUES[index++ % REVEAL_VENUES.length],
  );
}

function defineItem(
  id: string,
  name: string,
  category: ClothingCategory,
  brand: string,
  blurredDescription: string,
  unlockedDescription?: string,
  shopUrl?: string,
  canvas?: Pick<ClothingItem, "canvasImage" | "defaultCanvasPosition">,
): ClothingItem {
  return {
    id,
    name,
    category,
    brand,
    blurredDescription,
    unlockedDescription: unlockedDescription ?? revealDescription(blurredDescription),
    shopUrl: shopUrl ?? `https://shopier.com/cortis/${id}`,
    ...canvas,
  };
}

export const clothingItems: ClothingItem[] = [
  defineItem(
    "black-beanie-01",
    "BLACK BEANIE",
    "headwear",
    "Chanel",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Cortis Archive Seoul — Available at select vintage markets in Dongdaemun Vintage Market.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-01/black-beanie-01.png",
      defaultCanvasPosition: {
        top: "2.34%",
        left: "17.96%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "compression-shirt-01",
    "COMPRESSION SHIRT",
    "tops",
    "Archive Atelier",
    "Sourced via [BLURRED] archive — Limited restock at [BLURRED] concept store.",
    "Sourced via Cortis Archive Seoul — Limited restock at Garosu-gil Concept Store.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-01/compression-shirt-01.png",
      defaultCanvasPosition: {
        top: "28%",
        left: "30%",
        width: "40%",
        zIndex: 6,
      },
    },
  ),
  defineItem(
    "bootcut-jeans-02",
    "BOOTCUT JEANS",
    "bottoms",
    "Levi's Vintage",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Itaewon Antiquity Lane — Available at select vintage markets in Dongdaemun Vintage Market.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-01/bootcut-jeans-02.png",
      defaultCanvasPosition: {
        top: "48%",
        left: "25%",
        width: "38%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "black-sunglasses-01",
    "BLACK SUNGLASSES",
    "accessories",
    "Oliver Peoples",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Hanam Vintage Depot — Available at select vintage markets in Apgujeong Private Sale.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-01/black-sunglasses-01.png",
      defaultCanvasPosition: {
        top: "6%",
        left: "5%",
        width: "24%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "sneakers-01",
    "SNEAKERS",
    "shoes",
    "Balenciaga",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Garosu-gil Concept Store — Available at select vintage markets in Cortis Archive Seoul.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-01/sneakers-01.png",
      defaultCanvasPosition: {
        top: "72%",
        left: "8%",
        width: "32%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "black-bag-01",
    "BLACK BAG",
    "accessories",
    "Coach Vintage",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Dongdaemun Vintage Market — Available at select vintage markets in Itaewon Antiquity Lane.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-01/black-bag-01.png",
      defaultCanvasPosition: {
        top: "58%",
        left: "62%",
        width: "28%",
        zIndex: 4,
      },
    },
  ), 
  defineItem(
    "sunglasses-02",
    "SUNGLASSES",
    "accessories",
    "Oliver Peoples",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Hanam Vintage Depot — Available at select vintage markets in Apgujeong Private Sale.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-02/sunglasses-02.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "necklace-01",
    "NECKLACE",
    "accessories",
    "The Row",
    "Tailored through [BLURRED] atelier — Exclusive drop on [BLURRED].",
    "Tailored through Cortis Archive Seoul atelier — Exclusive drop on Garosu-gil Concept Store.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-02/necklace-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "longsleeve-shirt-01",
    "LONG-SLEEVE SHIRT",
    "tops",
    "Margiela",
    "Purchased from [BLURRED] — Restocked monthly at [BLURRED] flagship.",
    "Purchased from Dongdaemun Vintage Market — Restocked monthly at Apgujeong Private Sale flagship.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-02/longsleeve-shirt-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "shorts-01",
    "SHORTS",
    "bottoms",
    "Bottega Veneta",
    "Hand-finished by [BLURRED] — Available at [BLURRED] accessories hall.",
    "Hand-finished by Itaewon Antiquity Lane — Available at Hanam Vintage Depot accessories hall.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-02/shorts-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "black-bag-02",
    "BLACK BAG",
    "accessories",
    "Coach Vintage",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Dongdaemun Vintage Market — Available at select vintage markets in Itaewon Antiquity Lane.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-02/black-bag-02.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "sneakers-02",
    "SNEAKERS",
    "shoes",
    "Balenciaga",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Garosu-gil Concept Store — Available at select vintage markets in Cortis Archive Seoul.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-02/sneakers-02.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "cap-01",
    "CAP",
    "accessories",
    "Supreme",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Dongdaemun Vintage Market — Available at select vintage markets in Itaewon Antiquity Lane.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-03/cap-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "necklace-02",
    "NECKLACE",
    "accessories",
    "The Row",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Dongdaemun Vintage Market — Available at select vintage markets in Itaewon Antiquity Lane.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-03/necklace-02.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),  
  defineItem(
    "tank-top-01",
    "TANK TOP",
    "tops",
    "Supreme",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Dongdaemun Vintage Market — Available at select vintage markets in Itaewon Antiquity Lane.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-03/tank-top-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },  
    },
  ),
  defineItem(
    "sunglasses-01",
    "SUNGLASSES",
    "accessories",
    "Oliver Peoples",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Hanam Vintage Depot — Available at select vintage markets in Apgujeong Private Sale.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-03/sunglasses-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },  
    },
  ),
  defineItem(
    "baggy-jeans-01", 
    "BAGGY JEANS",
    "bottoms",
    "Levi's Vintage",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Dongdaemun Vintage Market — Available at select vintage markets in Itaewon Antiquity Lane.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-03/baggy-jeans-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "bracelet-01",
    "BRACELET",
    "accessories",
    "The Row",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Dongdaemun Vintage Market — Available at select vintage markets in Itaewon Antiquity Lane.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-03/bracelet-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
  defineItem(
    "teal-bag-01",
    "TEAL BAG",
    "accessories",
    "The Row",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Dongdaemun Vintage Market — Available at select vintage markets in Itaewon Antiquity Lane.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-03/teal-bag-01.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
    defineItem(
      "sneakers-03",
    "SNEAKERS",
    "shoes",
    "Balenciaga",
    "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
    "Purchased from Garosu-gil Concept Store — Available at select vintage markets in Cortis Archive Seoul.",
    undefined,
    {
      canvasImage: "/images/clothes/outfit-03/sneakers-03.png",
      defaultCanvasPosition: {
        top: "10%",
        left: "10%",
        width: "20%",
        zIndex: 4,
      },
    },
  ),
 
];

const clothingItemMap = new Map(
  clothingItems.map((item) => [item.id, item]),
);

export function getClothingItem(id: string): ClothingItem | undefined {
  return clothingItemMap.get(id);
}
