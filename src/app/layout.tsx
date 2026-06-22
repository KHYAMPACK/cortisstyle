import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
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
  title: "Cortis Style — Lookbook",
  description: "An editorial fashion lookbook by Cortis Style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
