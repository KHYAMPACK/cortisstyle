import type { ItemCoordinates, Look, LookItem } from "@/types/look";

const IMAGE_WIDTH = 1700;
const IMAGE_HEIGHT = 2500;

type ItemInput = Omit<LookItem, "coordinates">;

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

function createItems(
  items: ItemInput[],
  coordinates: ItemCoordinates[],
): LookItem[] {
  return items.map((item, index) => ({
    ...item,
    coordinates: coordinates[index],
  }));
}

export const looks: Look[] = [
  {
    id: "look-01",
    title: "Look 01 — Cyber Grunge",
    image: "/images/temp_image_0AD45B1B-0275-4C7F-817B-E22C2700E090.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-01-item-01",
          name: "Black Vintage Beanie",
          blurredDescription:
            "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
        },
        {
          id: "look-01-item-02",
          name: "Chrome Mesh Layer Top",
          blurredDescription:
            "Sourced via [BLURRED] archive — Limited restock at [BLURRED] concept store.",
        },
        {
          id: "look-01-item-03",
          name: "Baggy Jeans",
          blurredDescription:
            "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
        },
        {
          id: "look-01-item-04",
          name: "Vintage Sunglasses",
          blurredDescription:
            "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
        },
        {
          id: "look-01-item-05",
          name: "Chunky Sneakers",
          blurredDescription:
            "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
        },
        {
          id: "look-01-item-06",
          name: "Leather Vintage Bag",
          blurredDescription:
            "Purchased from [BLURRED] — Available at select vintage markets in [BLURRED].",
        },
      ],
      [
        leader("10.2%", "32.4%", "5.7%", "47.8%"),
leader("36%", "48%", "40%", "20%"),
leader("54.0%", "41.2%", "54%", "16%"),
leader("23.5%", "20.8%", "17.2%", "15.7%"),
leader("76.8%", "17.4%", "68.2%", "21.2%"),
leader("62.5%", "78.6%", "73.2%", "79.2%"),
      ],
    ),
  },
  {
    id: "look-02",
    title: "Look 02 — Monochrome Silence",
    image: "/images/temp_image_173022D3-DEF3-4AE1-925F-D805072E95B3.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-02-item-01",
          name: "Oversized Wool Overcoat",
          blurredDescription:
            "Tailored through [BLURRED] atelier — Exclusive drop on [BLURRED].",
        },
        {
          id: "look-02-item-02",
          name: "Raw Hem Trousers",
          blurredDescription:
            "Purchased from [BLURRED] — Restocked monthly at [BLURRED] flagship.",
        },
        {
          id: "look-02-item-03",
          name: "Sculpted Leather Belt",
          blurredDescription:
            "Hand-finished by [BLURRED] — Available at [BLURRED] accessories hall.",
        },
      ],
      [
        leader("20%", "48%", "14%", "62%"),
        leader("52%", "42%", "48%", "28%"),
        leader("70%", "48%", "76%", "58%"),
      ],
    ),
  },
  {
    id: "look-03",
    title: "Look 03 — Raw Editorial",
    image: "/images/temp_image_25420D54-8401-4EA4-9534-08085AA504B3.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-03-item-01",
          name: "Deconstructed Blazer",
          blurredDescription:
            "Archive piece from [BLURRED] — Listed on [BLURRED] private sale.",
        },
        {
          id: "look-03-item-02",
          name: "Sheer Panel Shirt",
          blurredDescription:
            "Sourced at [BLURRED] showroom — Available through [BLURRED] members club.",
        },
        {
          id: "look-03-item-03",
          name: "Stacked Silver Rings",
          blurredDescription:
            "Collected from [BLURRED] — In stock at [BLURRED] jewelry counter.",
        },
      ],
      [
        leader("24%", "42%", "18%", "32%"),
        leader("48%", "48%", "42%", "22%"),
        leader("36%", "58%", "28%", "68%"),
      ],
    ),
  },
  {
    id: "look-04",
    title: "Look 04 — Void Tailoring",
    image: "/images/temp_image_41B4D695-9371-4890-BCEC-26F783029E69.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-04-item-01",
          name: "Double-Breasted Suit Jacket",
          blurredDescription:
            "Commissioned via [BLURRED] — Fittings held at [BLURRED] studio.",
        },
        {
          id: "look-04-item-02",
          name: "Wide-Leg Pleated Pants",
          blurredDescription:
            "Purchased from [BLURRED] — Ships worldwide from [BLURRED].",
        },
        {
          id: "look-04-item-03",
          name: "Patent Oxford Shoes",
          blurredDescription:
            "Limited run at [BLURRED] — Resale listings on [BLURRED] marketplace.",
        },
      ],
      [
        leader("22%", "46%", "16%", "30%"),
        leader("58%", "42%", "52%", "24%"),
        leader("78%", "46%", "86%", "38%"),
      ],
    ),
  },
  {
    id: "look-05",
    title: "Look 05 — Industrial Poise",
    image: "/images/temp_image_5CAF4EFB-6498-4A2F-9DE7-D1F4BFEE885F.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-05-item-01",
          name: "Utility Cargo Vest",
          blurredDescription:
            "Found at [BLURRED] surplus depot — Restocked at [BLURRED] workwear lab.",
        },
        {
          id: "look-05-item-02",
          name: "Ribbed Tank Layer",
          blurredDescription:
            "Basics sourced from [BLURRED] — Bundle available on [BLURRED].",
        },
        {
          id: "look-05-item-03",
          name: "Steel-Toe Ankle Boots",
          blurredDescription:
            "Purchased through [BLURRED] — Pickup at [BLURRED] industrial district.",
        },
      ],
      [
        leader("18%", "48%", "10%", "64%"),
        leader("44%", "40%", "38%", "22%"),
        leader("74%", "44%", "82%", "30%"),
      ],
    ),
  },
  {
    id: "look-06",
    title: "Look 06 — Soft Brutalism",
    image: "/images/temp_image_70A042D0-CAC6-4AC8-A1E1-676876DD6FEE.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-06-item-01",
          name: "Concrete Grey Knit",
          blurredDescription:
            "Spun by [BLURRED] mill — Available at [BLURRED] knit atelier.",
        },
        {
          id: "look-06-item-02",
          name: "Structured Canvas Trousers",
          blurredDescription:
            "Tailored at [BLURRED] — In-store only at [BLURRED] concept space.",
        },
        {
          id: "look-06-item-03",
          name: "Minimalist Crossbody Bag",
          blurredDescription:
            "Leather sourced from [BLURRED] — Listed on [BLURRED] accessories edit.",
        },
      ],
      [
        leader("26%", "40%", "18%", "24%"),
        leader("55%", "44%", "48%", "18%"),
        leader("52%", "64%", "44%", "82%"),
      ],
    ),
  },
  {
    id: "look-07",
    title: "Look 07 — Nocturnal Layer",
    image: "/images/temp_image_7603B699-F9F9-40F3-AF43-8EA5ACD24F72.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-07-item-01",
          name: "Midnight Silk Shirt",
          blurredDescription:
            "Woven by [BLURRED] — Night market exclusive at [BLURRED].",
        },
        {
          id: "look-07-item-02",
          name: "Layered Chain Necklace",
          blurredDescription:
            "Vintage find from [BLURRED] — Curated drop on [BLURRED].",
        },
        {
          id: "look-07-item-03",
          name: "Suede Chelsea Boots",
          blurredDescription:
            "Purchased at [BLURRED] — Restock alert via [BLURRED] newsletter.",
        },
      ],
      [
        leader("21%", "44%", "14%", "28%"),
        leader("34%", "52%", "26%", "68%"),
        leader("76%", "46%", "84%", "22%"),
      ],
    ),
  },
  {
    id: "look-08",
    title: "Look 08 — Concrete Romance",
    image: "/images/temp_image_76EADAD7-87D4-4649-9923-B3D060ACD1BA.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-08-item-01",
          name: "Asymmetric Draped Top",
          blurredDescription:
            "Runway sample from [BLURRED] — Available at [BLURRED] archive sale.",
        },
        {
          id: "look-08-item-02",
          name: "Floor-Length Wool Skirt",
          blurredDescription:
            "Commissioned through [BLURRED] — Fittings at [BLURRED] atelier.",
        },
        {
          id: "look-08-item-03",
          name: "Sculpted Heeled Mules",
          blurredDescription:
            "Designer collab via [BLURRED] — Sold exclusively on [BLURRED].",
        },
      ],
      [
        leader("23%", "48%", "16%", "32%"),
        leader("60%", "42%", "54%", "20%"),
        leader("82%", "48%", "90%", "62%"),
      ],
    ),
  },
  {
    id: "look-09",
    title: "Look 09 — Static Motion",
    image: "/images/temp_image_95DC569E-5870-49FD-B619-26156683DFAC.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-09-item-01",
          name: "Motion-Print Windbreaker",
          blurredDescription:
            "Tech fabric from [BLURRED] — Limited release on [BLURRED].",
        },
        {
          id: "look-09-item-02",
          name: "Tapered Nylon Joggers",
          blurredDescription:
            "Performance line at [BLURRED] — Ships from [BLURRED] distribution hub.",
        },
        {
          id: "look-09-item-03",
          name: "Reflective Runner Sneakers",
          blurredDescription:
            "Sourced via [BLURRED] — In rotation at [BLURRED] sneaker vault.",
        },
      ],
      [
        leader("19%", "50%", "12%", "66%"),
        leader("50%", "42%", "44%", "24%"),
        leader("70%", "44%", "78%", "34%"),
      ],
    ),
  },
  {
    id: "look-10",
    title: "Look 10 — Pale Structure",
    image: "/images/temp_image_BA9895CE-E202-4395-A8F9-F1887D40902E.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-10-item-01",
          name: "Ivory Structured Blouse",
          blurredDescription:
            "Hand-stitched at [BLURRED] — Available at [BLURRED] bridal edit.",
        },
        {
          id: "look-10-item-02",
          name: "Pale Linen Trousers",
          blurredDescription:
            "Summer collection from [BLURRED] — Restocked at [BLURRED] resort shop.",
        },
        {
          id: "look-10-item-03",
          name: "Pearl Drop Earrings",
          blurredDescription:
            "Estate piece via [BLURRED] — Listed on [BLURRED] fine jewelry.",
        },
      ],
      [
        leader("25%", "38%", "18%", "22%"),
        leader("54%", "46%", "48%", "18%"),
        leader("30%", "56%", "22%", "72%"),
      ],
    ),
  },
  {
    id: "look-11",
    title: "Look 11 — Dissolved Form",
    image: "/images/temp_image_BFD792D8-8457-4412-905C-9FE51B6AA168.WEBP",
    modelName: "SEONGHYEON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-11-item-01",
          name: "Liquid Drape Cardigan",
          blurredDescription:
            "Experimental knit from [BLURRED] — Preview at [BLURRED] lab store.",
        },
        {
          id: "look-11-item-02",
          name: "Faded Wide Denim",
          blurredDescription:
            "Vintage wash from [BLURRED] — Available at [BLURRED] denim bar.",
        },
        {
          id: "look-11-item-03",
          name: "Translucent Frame Sunglasses",
          blurredDescription:
            "Eyewear collab via [BLURRED] — Sold on [BLURRED] optics floor.",
        },
      ],
      [
        leader("16%", "46%", "10%", "30%"),
        leader("62%", "40%", "56%", "18%"),
        leader("22%", "54%", "14%", "72%"),
      ],
    ),
  },
  {
    id: "look-12",
    title: "Look 12 — Final Frame",
    image: "/images/temp_image_F2334FB9-4D25-4EC6-9821-BE54537B0E98.WEBP",
    modelName: "JUHOON",
    shopierUrl: "https://shopier.com/placeholder",
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    items: createItems(
      [
        {
          id: "look-12-item-01",
          name: "Statement Trench Coat",
          blurredDescription:
            "Archive outerwear from [BLURRED] — Final units at [BLURRED] flagship.",
        },
        {
          id: "look-12-item-02",
          name: "Monogram Silk Scarf",
          blurredDescription:
            "Heritage print via [BLURRED] — Gift set on [BLURRED] luxury desk.",
        },
        {
          id: "look-12-item-03",
          name: "Polished Leather Loafers",
          blurredDescription:
            "Hand-burnished at [BLURRED] — Available through [BLURRED] menswear hall.",
        },
      ],
      [
        leader("18%", "36%", "12%", "20%"),
        leader("40%", "50%", "32%", "68%"),
        leader("75%", "46%", "84%", "28%"),
      ],
    ),
  },
];
