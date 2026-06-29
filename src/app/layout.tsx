import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { DynamicCatalogProvider } from "@/context/DynamicCatalogProvider";
import { buildCatalogFromDisk } from "@/data/catalog";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

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
      className={`${inter.variable} ${cormorant.variable} intro-loading h-full antialiased`}
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
