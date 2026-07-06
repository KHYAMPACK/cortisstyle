import { TrFooter } from "@/components/tr/TrFooter";
import { TrHeader } from "@/components/tr/TrHeader";

interface TrMarketplaceChromeProps {
  children: React.ReactNode;
}

export function TrMarketplaceChrome({ children }: TrMarketplaceChromeProps) {
  return (
    <div className="min-h-full bg-ice-floor text-jet-black">
      <TrHeader />
      <main className="pt-20">{children}</main>
      <TrFooter />
    </div>
  );
}
