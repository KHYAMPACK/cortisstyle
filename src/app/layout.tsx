import type { Metadata } from "next";
import { headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/Providers";
import { PATHNAME_HEADER, BOUTIQUE_SLUG_HEADER, rootHtmlClassName } from "@/lib/introLoader";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cortisstyle — Cadde",
  description:
    "Türkiye butik pazaryeri ve butik vitrinleri — Cortisstyle Cadde.",
  verification: {
    google: "lUtcENaTLXt-I3qvbtU_N3haAJ9CNXZ0QL7I1hZdGm8",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const pathname = headerList.get(PATHNAME_HEADER) ?? "/";
  const boutiqueSlug = headerList.get(BOUTIQUE_SLUG_HEADER);

  return (
    <html lang="tr" className={rootHtmlClassName(pathname, boutiqueSlug)}>
      <body className="min-h-full bg-ice-floor font-sans text-jet-black">
        <Providers boutiqueSlug={boutiqueSlug}>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
