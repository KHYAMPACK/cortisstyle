import { TrMarketplaceChrome } from "@/components/tr/TrMarketplaceChrome";

export default function TrPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TrMarketplaceChrome>{children}</TrMarketplaceChrome>;
}
