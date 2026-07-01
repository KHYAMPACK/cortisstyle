import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/Providers";
import { DynamicCatalogProvider } from "@/context/DynamicCatalogProvider";
import { buildCatalogFromDisk } from "@/data/catalog";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cortisstyle — Lookbook",
  description: "An editorial fashion lookbook by Cortisstyle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = buildCatalogFromDisk();

  return (
    <html
      lang="en"
      className="intro-loading h-full antialiased"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('intro-loading');",
          }}
        />
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
