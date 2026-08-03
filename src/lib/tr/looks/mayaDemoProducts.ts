/**
 * Generated Maya Atelier demo catalog — 150 products for PLP / filter demos.
 * Images cycle the local Unsplash set under /tr/boutiques/demo-maya/.
 */

const MAYA_ASSET = (name: string) => `/tr/boutiques/demo-maya/${name}`;

export type MayaProductSpec = {
  id: string;
  title: string;
  priceKurus: number;
  compareAtPriceKurus?: number;
  category: string;
  image: string;
  colors: Array<{ name: string; hex: string }>;
  isNew?: boolean;
  sortOrder: number;
};

const IMAGE_POOL = [
  "p-1.jpg",
  "p-2.jpg",
  "p-3.jpg",
  "p-4.jpg",
  "p-5.jpg",
  "p-6.jpg",
  "p-7.jpg",
  "p-8.jpg",
  "p-9.jpg",
  "p-10.jpg",
  "p-11.jpg",
  "p-12.jpg",
  "p-13.jpg",
  "p-14.jpg",
  "cat-ceket.jpg",
  "cat-parka.jpg",
  "cat-jean.jpg",
  "cat-trenckot.jpg",
  "ig-1.jpg",
  "ig-2.jpg",
  "ig-3.jpg",
  "ig-4.jpg",
  "ig-5.jpg",
].map(MAYA_ASSET);

const COLOR_PALETTE: Array<{ name: string; hex: string }> = [
  { name: "Siyah", hex: "#111111" },
  { name: "Beyaz", hex: "#FFFFFF" },
  { name: "Ekru", hex: "#F5F0E6" },
  { name: "Bej", hex: "#D4C4A8" },
  { name: "Bordo", hex: "#722F37" },
  { name: "Kırmızı", hex: "#C41E3A" },
  { name: "Gri", hex: "#6B7280" },
  { name: "Lacivert", hex: "#1E3A5F" },
  { name: "Kahve", hex: "#5C4033" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Indigo", hex: "#3F4C6B" },
  { name: "Açık Mavi", hex: "#8BA3C7" },
  { name: "Zeytin", hex: "#6B7F5A" },
  { name: "Pudra", hex: "#E8B4B8" },
  { name: "Naturel", hex: "#E8DCC8" },
];

type Template = {
  category: string;
  stems: string[];
  basePrice: number;
  priceStep: number;
};

const TEMPLATES: Template[] = [
  {
    category: "ust-giyim",
    stems: [
      "Soft Touch Balıkçı Yaka Bluz",
      "V Yaka Gold Broşlu Bluz",
      "Polo Yaka Düğmeli Triko",
      "Cozzy Uzun Kollu Basic Bluz",
      "Basic Bisiklet Yaka",
      "Oversize Gömlek",
      "Crop Kazak",
      "Saten Gömlek",
      "Modal Atlet",
      "Kaşkorse Bluz",
      "Keten Gömlek",
      "Düğmeli Triko Yelek",
    ],
    basePrice: 29999,
    priceStep: 4500,
  },
  {
    category: "elbise",
    stems: [
      "Midi Keten Elbise",
      "Straplez Mini Elbise",
      "Julie Apolet Detaylı Kemerli Elbise",
      "Belden Oturtmalı Ekoseli Elbise",
      "Pileli Midi Elbise",
      "Gömlek Yaka Elbise",
      "Askılı Maxi Elbise",
      "Desenli Yaz Elbisesi",
      "Kare Yaka Elbise",
      "Fırfır Detaylı Elbise",
    ],
    basePrice: 64999,
    priceStep: 7500,
  },
  {
    category: "alt-giyim",
    stems: [
      "Geniş Paça Jean",
      "Yüksek Bel Şort",
      "Pileli Midi Etek",
      "Palazzo Pantolon",
      "Slim Fit Jean",
      "Keten Bol Paça",
      "Mini Denim Etek",
      "Cargo Pantolon",
      "Yüksek Bel Tayt",
      "Klasik Chino",
    ],
    basePrice: 44999,
    priceStep: 5500,
  },
  {
    category: "dis-giyim",
    stems: [
      "Oversize Blazer Ceket",
      "Klasik Trençkot",
      "Kapitoneli Parka",
      "Kısa Deri Ceket",
      "Uzun Yün Kaban",
      "Bomber Ceket",
      "Keten Blazer",
      "Kapüşonlu Yağmurluk",
      "Crop Ceket",
      "Kaşe Kaban",
    ],
    basePrice: 99999,
    priceStep: 12000,
  },
  {
    category: "beach",
    stems: [
      "Keten Beach Tunik",
      "Crochet Plaj Elbisesi",
      "Pareo Etek",
      "Bikini Üst",
      "Plaj Şortu",
      "Hasır Detaylı Tunik",
      "Açık Omuz Plaj Elbisesi",
      "Keten Kimono",
    ],
    basePrice: 39999,
    priceStep: 5000,
  },
  {
    category: "takim",
    stems: [
      "Keten İkili Takım",
      "Blazer Pantolon Takım",
      "Triko Takım",
      "Şort Gömlek Takım",
      "Etek Bluz Kombini",
      "İş Takımı",
    ],
    basePrice: 149999,
    priceStep: 15000,
  },
];

const MAYA_PRODUCT_COUNT = 150;

function pickColors(index: number): Array<{ name: string; hex: string }> {
  const count = 1 + (index % 5);
  const colors: Array<{ name: string; hex: string }> = [];
  for (let i = 0; i < count; i += 1) {
    const color = COLOR_PALETTE[(index + i * 3) % COLOR_PALETTE.length]!;
    if (!colors.some((entry) => entry.name === color.name)) {
      colors.push(color);
    }
  }
  return colors.length > 0 ? colors : [COLOR_PALETTE[0]!];
}

function buildPrice(template: Template, index: number): {
  priceKurus: number;
  compareAtPriceKurus?: number;
} {
  const priceKurus =
    template.basePrice + (index % 12) * template.priceStep + (index % 3) * 999;
  // ~22% on sale
  if (index % 9 === 0 || index % 7 === 3) {
    const compareAtPriceKurus = Math.round(priceKurus * (1.15 + (index % 4) * 0.05));
    return { priceKurus, compareAtPriceKurus };
  }
  return { priceKurus };
}

/** Build exactly 150 Maya demo product specs. */
export function buildMayaProductSpecs(): MayaProductSpec[] {
  const specs: MayaProductSpec[] = [];
  let n = 0;

  while (specs.length < MAYA_PRODUCT_COUNT) {
    const template = TEMPLATES[n % TEMPLATES.length]!;
    const stem = template.stems[Math.floor(n / TEMPLATES.length) % template.stems.length]!;
    const colors = pickColors(n);
    const primaryColor = colors[0]!.name;
    const { priceKurus, compareAtPriceKurus } = buildPrice(template, n);
    const sortOrder = n + 1;

    specs.push({
      id: `demo-product-maya-${sortOrder}`,
      title: `${stem} - ${primaryColor}`,
      priceKurus,
      compareAtPriceKurus,
      category: template.category,
      image: IMAGE_POOL[n % IMAGE_POOL.length]!,
      colors,
      isNew: n % 5 === 0 || n < 20,
      sortOrder,
    });

    n += 1;
  }

  return specs;
}

export const MAYA_DEMO_PRODUCT_COUNT = MAYA_PRODUCT_COUNT;
