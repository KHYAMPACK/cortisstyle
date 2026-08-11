import type { ReactNode } from "react";
import Link from "next/link";
import { siteLegal } from "@/lib/siteLegal";

interface LegalPageShellProps {
  title: string;
  children: ReactNode;
  kicker?: string;
  showEffectiveDate?: boolean;
}

export function LegalHeading({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="mt-8 font-serif text-xl tracking-[-0.01em] text-neutral-950 first:mt-0"
    >
      {children}
    </h2>
  );
}

export function LegalSubheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-5 font-serif text-base tracking-[0.02em] text-neutral-900">
      {children}
    </h3>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-sm leading-relaxed text-neutral-700">{children}</p>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-700">
      {children}
    </ul>
  );
}

export function LegalPageShell({
  title,
  children,
  kicker = "Yasal",
  showEffectiveDate = true,
}: LegalPageShellProps) {
  return (
    <div className="min-h-full bg-ice-floor text-jet-black">
      <header className="border-b border-blueprint-border px-5 py-6 md:px-10">
        <Link
          href="/tr"
          className="text-meta text-[9px] tracking-[0.35em] uppercase transition-colors hover:text-jet-black"
        >
          ← Cadde
        </Link>
      </header>

      <article className="mx-auto max-w-2xl px-5 py-10 md:py-14">
        <p className="text-meta text-[9px] tracking-[0.42em] uppercase">{kicker}</p>
        <h1 className="mt-3 font-serif text-3xl leading-tight tracking-[-0.02em] text-neutral-950 md:text-4xl">
          {title}
        </h1>
        {showEffectiveDate ? (
          <p className="text-meta mt-3 text-[10px] tracking-[0.2em] uppercase">
            Effective {siteLegal.effectiveDate}
          </p>
        ) : null}

        <div className="mt-10 border-t border-blueprint-border pt-8">{children}</div>
      </article>

      <footer className="border-t border-blueprint-border px-5 py-8 text-center text-[11px] text-neutral-500 md:px-10">
        <Link href="/privacy" className="underline underline-offset-2">
          Gizlilik
        </Link>
        <span className="mx-3">·</span>
        <Link href="/terms" className="underline underline-offset-2">
          Koşullar
        </Link>
      </footer>
    </div>
  );
}
