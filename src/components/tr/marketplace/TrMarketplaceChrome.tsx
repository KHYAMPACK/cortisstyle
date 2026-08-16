import { CaddePageTransition } from "@/components/tr/marketplace/CaddePageTransition";
import { TrAddedToCartSheet } from "@/components/tr/TrAddedToCartSheet";
import { TrFooter } from "@/components/tr/TrFooter";
import { TrHeader } from "@/components/tr/TrHeader";
import { TrMarketplaceCacheProvider } from "@/components/tr/TrMarketplaceCacheProvider";
import { TrMarketplaceShell } from "@/components/tr/TrMarketplaceShell";
import type {
  TrBoutiquePublic,
  TrProductWithBoutique,
} from "@/types/tr-marketplace";

interface TrMarketplaceChromeProps {
  children: React.ReactNode;
  /** Seeded on marketplace layout for optimistic catalog routes. */
  catalogSeed?: {
    products: TrProductWithBoutique[];
    boutiques: TrBoutiquePublic[];
  };
}

export function TrMarketplaceChrome({
  children,
  catalogSeed,
}: TrMarketplaceChromeProps) {
  const body = catalogSeed ? (
    <TrMarketplaceCacheProvider
      initialProducts={catalogSeed.products}
      initialBoutiques={catalogSeed.boutiques}
    >
      {children}
      <TrAddedToCartSheet />
    </TrMarketplaceCacheProvider>
  ) : (
    <>
      {children}
      <TrAddedToCartSheet />
    </>
  );

  return (
    <CaddePageTransition>
      <TrMarketplaceShell chrome={<TrHeader />} footer={<TrFooter />}>
        {body}
      </TrMarketplaceShell>
    </CaddePageTransition>
  );
}
