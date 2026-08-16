import type { ReactNode } from "react";
import {
  CADDE_DISPLAY,
  CADDE_KICKER,
  caddeIndexLabel,
} from "@/lib/tr/marketplace/caddeUi";

interface TrSectionHeaderProps {
  /** Display heading — serif, primary signal. */
  title: string;
  /** Quiet uppercase label above the title. */
  kicker?: string;
  description?: string;
  children?: ReactNode;
  /** Left (default) or centered editorial block. */
  align?: "left" | "center";
  /**
   * Extra top padding so floating corner chrome (menu / icons)
   * doesn’t sit on the title — use on full catalog pages.
   */
  clearChrome?: boolean;
  /**
   * `cadde` uses hero type + red numbered kickers.
   * Default stays boutique-safe (serif / teal).
   */
  tone?: "default" | "cadde";
  /** Cadde series number, e.g. "01". */
  index?: string;
}

export function TrSectionHeader({
  title,
  kicker,
  description,
  children,
  align = "left",
  clearChrome = false,
  tone = "default",
  index,
}: TrSectionHeaderProps) {
  const centered = align === "center";
  const cadde = tone === "cadde";
  const kickerText =
    cadde && index ? caddeIndexLabel(index, kicker ?? title) : kicker;

  return (
    <div
      className={`relative px-5 md:px-10 ${
        cadde ? "border-b border-black/10" : "border-b border-blueprint-border"
      } ${
        clearChrome ? "pt-20 pb-8 md:pt-24 md:pb-10" : "py-8 md:py-10"
      } ${centered ? "text-center" : ""}`}
    >
      {cadde ? null : (
        <span
          className={`absolute bottom-0 h-0.5 w-10 bg-brand-primary ${
            centered ? "left-1/2 -translate-x-1/2" : "left-5 md:left-10"
          }`}
          aria-hidden
        />
      )}
      {kickerText ? (
        <p
          className={
            cadde
              ? CADDE_KICKER
              : "text-[10px] tracking-[0.18em] text-brand-primary uppercase"
          }
        >
          {kickerText}
        </p>
      ) : null}
      <h2
        className={`${
          cadde
            ? `${CADDE_DISPLAY} text-[2rem] md:text-[2.75rem]`
            : "font-serif text-2xl leading-none tracking-[-0.02em] text-neutral-950 md:text-3xl"
        } ${kickerText ? "mt-3" : ""}`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-3 text-[12px] leading-relaxed ${
            cadde
              ? "max-w-xl font-cadde-nav tracking-[0.06em] text-neutral-500"
              : `text-meta text-[11px] tracking-[0.08em] ${
                  centered ? "mx-auto max-w-lg" : "max-w-2xl"
                }`
          } ${centered && cadde ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
