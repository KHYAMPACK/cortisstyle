import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";
import {
  safeListMarketplaceBoutiques,
  safeListPublicCatalogProducts,
} from "@/lib/tr/publicData";

export default async function TrMarketplaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [products, boutiques] = await Promise.all([
    safeListPublicCatalogProducts(),
    safeListMarketplaceBoutiques(),
  ]);

  return (
    <TrMarketplaceChrome catalogSeed={{ products, boutiques }}>
      {children}
    </TrMarketplaceChrome>
  );
}
