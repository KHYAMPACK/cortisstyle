/** Presentation copy + media for the Maya Atelier editorial demo homepage. */

export const EDITORIAL_DEMO_SLUG = "demo-maya";
export const EDITORIAL_SALE_RED = "#C41E3A";

const ASSET = (name: string) => `/tr/boutiques/demo-maya/${name}`;

export type EditorialNavItem = {
  id: string;
  label: string;
  /** Catalog category id, "sale" for discounted products, or null for all. */
  categoryId: string | null;
  accent?: "sale";
};

export type EditorialDemoContent = {
  nav: EditorialNavItem[];
  promo: {
    eyebrow: string;
    discount: string;
    discountScript: string;
    title: string;
    image: string;
    imageLabel: string;
    imageCta: string;
  };
  editorial: {
    headline: string;
    body: string;
    cta: string;
    image: string;
    imageTitle: string;
    imageCta: string;
  };
  categoryTiles: Array<{
    categoryId: string;
    label: string;
    image: string;
    cta: string;
  }>;
  lifestyle: {
    image: string;
    body: string;
    cta: string;
  };
  highlight: {
    body: string;
    cta: string;
  };
  instagram: {
    title: string;
    handle: string;
    images: string[];
  };
  usps: Array<{
    id: string;
    label: string;
    icon: "secure" | "customers" | "shipping" | "payment";
  }>;
  footer: {
    newsletterTitle: string;
    newsletterBody: string;
    newsletterPlaceholder: string;
    newsletterCta: string;
    phone: string;
    email: string;
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
  };
};

export function getEditorialDemoContent(): EditorialDemoContent {
  return {
    nav: [
      { id: "new", label: "En Yeniler", categoryId: null },
      { id: "elbise", label: "Elbise", categoryId: "elbise" },
      { id: "ust", label: "Üst Giyim", categoryId: "ust-giyim" },
      { id: "alt", label: "Alt Giyim", categoryId: "alt-giyim" },
      { id: "beach", label: "Beach", categoryId: "beach" },
      {
        id: "sale",
        label: "İndirim",
        categoryId: "sale",
        accent: "sale",
      },
    ],
    promo: {
      eyebrow: "Seçili ürünlerde",
      discount: "%70'e",
      discountScript: "Varan",
      title: "İndirim",
      image: ASSET("hero-promo.jpg"),
      imageLabel: "Selection",
      imageCta: "Daha fazlasını keşfet",
    },
    editorial: {
      headline: "Zamana meydan okuyan klasikler",
      body: "Sezonun en çok tercih edilen parçaları; modern dokular, rahat kesimler ve zamansız detaylarla bir araya geliyor. Yaz stilini tamamlayacak en çok sevilecek seçimleri şimdi keşfet.",
      cta: "Keşfet",
      image: ASSET("hero-editorial.jpg"),
      imageTitle: "Sezonun en sevilenleri",
      imageCta: "Şimdi keşfet",
    },
    categoryTiles: [
      {
        categoryId: "dis-giyim",
        label: "Ceket",
        image: ASSET("cat-ceket.jpg"),
        cta: "Şimdi keşfet",
      },
      {
        categoryId: "dis-giyim",
        label: "Parka",
        image: ASSET("cat-parka.jpg"),
        cta: "Şimdi keşfet",
      },
      {
        categoryId: "alt-giyim",
        label: "Jean",
        image: ASSET("cat-jean.jpg"),
        cta: "Şimdi keşfet",
      },
      {
        categoryId: "dis-giyim",
        label: "Trençkot",
        image: ASSET("cat-trenckot.jpg"),
        cta: "Şimdi keşfet",
      },
    ],
    lifestyle: {
      image: ASSET("hero-lifestyle.jpg"),
      body: "Zarif dokunuşlar, zamansız kesimler ve modern silüetlerle Maya Atelier; günlük şıklığı sezonun en sevilen parçalarında buluşturur.",
      cta: "Alışverişe başla",
    },
    highlight: {
      body: "Öne çıkanlar — yaz sezonunun en çok tercih edilen parçalarıyla stiline modern, hafif ve zamansız bir dokunuş kat. Günlük şıklıktan yaz akşamlarına uzanan kombinlerin vazgeçilmezi olacak seçkiler şimdi seni bekliyor.",
      cta: "Şimdi keşfet",
    },
    instagram: {
      title: "Bizi Instagram'da takip et!",
      handle: "mayaatelier.demo",
      images: [
        ASSET("ig-1.jpg"),
        ASSET("ig-2.jpg"),
        ASSET("ig-3.jpg"),
        ASSET("ig-4.jpg"),
        ASSET("ig-5.jpg"),
      ],
    },
    usps: [
      { id: "secure", label: "Güvenli Alışveriş", icon: "secure" },
      { id: "customers", label: "Müşteri Memnuniyeti", icon: "customers" },
      { id: "shipping", label: "Hızlı Teslimat", icon: "shipping" },
      { id: "payment", label: "Ödeme Seçenekleri", icon: "payment" },
    ],
    footer: {
      newsletterTitle: "E-Bülten Kayıt",
      newsletterBody:
        "Özel indirimler ve son yenilikler için bültenimize kayıt olun!",
      newsletterPlaceholder: "E-posta adresinizi girin",
      newsletterCta: "Gönder",
      phone: "0850 000 00 00",
      email: "info@mayaatelier.demo",
      columns: [
        {
          title: "Kurumsal",
          links: [
            { label: "Hakkımızda", href: "#" },
            { label: "KVKK", href: "#" },
            { label: "Üyelik Sözleşmesi", href: "#" },
          ],
        },
        {
          title: "Alışveriş Rehberi",
          links: [
            { label: "İade & Hediye Çeki", href: "#" },
            { label: "Kargom Nerede?", href: "#" },
            { label: "Kolay İade", href: "#" },
            { label: "Siparişlerim", href: "#" },
          ],
        },
      ],
    },
  };
}
