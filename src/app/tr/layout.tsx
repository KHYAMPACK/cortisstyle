import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Cortisstyle Türkiye",
    template: "%s — Cortisstyle Türkiye",
  },
  description:
    "Bağımsız Türk butiklerinden seçilmiş tek parça ürünler. Ürün keşfi ve butik vitrinleri.",
};

export default function TrMarketLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div lang="tr" className="min-h-full">
      {children}
    </div>
  );
}
