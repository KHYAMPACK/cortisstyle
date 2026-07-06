import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";

export default function TrMarketplaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TrMarketplaceChrome>{children}</TrMarketplaceChrome>;
}
