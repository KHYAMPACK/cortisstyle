import type { ReactNode } from "react";

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
}

export function TrSectionHeader({
  title,
  kicker,
  description,
  children,
  align = "left",
  clearChrome = false,
}: TrSectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={`relative border-b border-blueprint-border px-5 md:px-10 ${
        clearChrome ? "pt-20 pb-8 md:pt-24 md:pb-10" : "py-8 md:py-10"
      } ${centered ? "text-center" : ""}`}
    >
      <span
        className={`absolute bottom-0 h-0.5 w-10 bg-brand-primary ${
          centered ? "left-1/2 -translate-x-1/2" : "left-5 md:left-10"
        }`}
        aria-hidden
      />
      {kicker ? (
        <p className="text-[10px] tracking-[0.18em] text-brand-primary uppercase">
          {kicker}
        </p>
      ) : null}
      <h2
        className={`font-serif text-2xl leading-none tracking-[-0.02em] text-neutral-950 md:text-3xl ${
          kicker ? "mt-3" : ""
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`text-meta mt-3 text-[11px] leading-relaxed tracking-[0.08em] ${
            centered ? "mx-auto max-w-lg" : "max-w-2xl"
          }`}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
