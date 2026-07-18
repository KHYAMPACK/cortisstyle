import type { ReactNode } from "react";

interface TrSectionHeaderProps {
  /** Display heading — serif, primary signal. */
  title: string;
  /** Quiet uppercase label above the title. */
  kicker?: string;
  description?: string;
  children?: ReactNode;
}

export function TrSectionHeader({
  title,
  kicker,
  description,
  children,
}: TrSectionHeaderProps) {
  return (
    <div className="relative border-b border-blueprint-border px-5 py-8 md:px-10 md:py-10">
      <span
        className="absolute bottom-0 left-5 h-0.5 w-10 bg-brand-primary md:left-10"
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
        <p className="text-meta mt-3 max-w-2xl text-[11px] leading-relaxed tracking-[0.08em]">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
