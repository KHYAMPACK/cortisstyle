import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AwinSiteVerificationMeta } from "@/components/legal/AwinSiteVerificationMeta";
import { ImpactSiteVerificationMeta } from "@/components/legal/ImpactSiteVerificationMeta";
import { Providers } from "@/components/Providers";
import { DynamicCatalogProvider } from "@/context/DynamicCatalogProvider";
import { buildCatalogFromDisk } from "@/data/catalog";
import { PATHNAME_HEADER, rootHtmlClassName } from "@/lib/introLoader";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cortisstyle — Lookbook",
  description: "An editorial fashion lookbook by Cortisstyle.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = buildCatalogFromDisk();
  const pathname = (await headers()).get(PATHNAME_HEADER) ?? "/";

  return (
    <html lang="en" className={rootHtmlClassName(pathname)}>
      <head>
        <AwinSiteVerificationMeta />
        <ImpactSiteVerificationMeta />
      </head>
      <body className="min-h-full bg-ice-floor font-sans text-jet-black">
        <DynamicCatalogProvider bundle={catalog}>
          <Providers>{children}</Providers>
        </DynamicCatalogProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
