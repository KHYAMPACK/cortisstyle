import { Nunito } from "next/font/google";

const minimoraWordmarkFont = Nunito({
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
});

interface MinimoraWordmarkProps {
  className?: string;
}

/** Lowercase rounded wordmark — Petit-style logotype, not an image mark. */
export function MinimoraWordmark({ className = "" }: MinimoraWordmarkProps) {
  return (
    <span
      className={`${minimoraWordmarkFont.className} text-[1.6rem] leading-none font-extrabold tracking-[-0.04em] text-[#1a1a1a] lowercase md:text-[1.85rem] ${className}`}
    >
      minimora
    </span>
  );
}
