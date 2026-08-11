import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AwinSiteVerificationMeta } from "@/components/legal/AwinSiteVerificationMeta";
import { ImpactSiteVerificationMeta } from "@/components/legal/ImpactSiteVerificationMeta";
import { Providers } from "@/components/Providers";
import { DynamicCatalogProvider } from "@/context/DynamicCatalogProvider";
import { buildCatalogFromDisk } from "@/data/catalog";
import { PATHNAME_HEADER, BOUTIQUE_SLUG_HEADER, rootHtmlClassName } from "@/lib/introLoader";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cortisstyle — Lookbook",
  description: "An editorial fashion lookbook by Cortisstyle.",
  verification: {
    google: "lUtcENaTLXt-I3qvbtU_N3haAJ9CNXZ0QL7I1hZdGm8",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = buildCatalogFromDisk();
  const headerList = await headers();
  const pathname = headerList.get(PATHNAME_HEADER) ?? "/";
  const boutiqueSlug = headerList.get(BOUTIQUE_SLUG_HEADER);

  return (
    <html lang="en" className={rootHtmlClassName(pathname, boutiqueSlug)}>
      <head>
        <AwinSiteVerificationMeta />
        <ImpactSiteVerificationMeta />
      </head>
      <body className="min-h-full bg-ice-floor font-sans text-jet-black">
        <DynamicCatalogProvider bundle={catalog}>
          <Providers boutiqueSlug={boutiqueSlug}>{children}</Providers>
        </DynamicCatalogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
