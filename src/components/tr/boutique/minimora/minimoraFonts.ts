import { Outfit, Syne } from "next/font/google";

export const minimoraBodyFont = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-minimora-body",
});

export const minimoraDisplayFont = Syne({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-minimora-display",
});
