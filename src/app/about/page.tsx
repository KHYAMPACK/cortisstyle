import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalHeading,
  LegalPageShell,
  LegalParagraph,
} from "@/components/legal/LegalPageShell";
import { siteLegal } from "@/lib/siteLegal";

export const metadata: Metadata = {
  title: "About — Cortisstyle",
  description:
    "About Cortisstyle — an editorial SS26 lookbook with shoppable looks and a digital wardrobe.",
};

export default function AboutPage() {
  return (
    <LegalPageShell title="About Cortisstyle" kicker="About" showEffectiveDate={false}>
      <LegalParagraph>
        {siteLegal.siteName} is an editorial SS26 lookbook — curated outfits,
        shoppable breakdowns, and a digital wardrobe for building your own looks.
      </LegalParagraph>

      <LegalParagraph>
        We are operated by <strong>{siteLegal.operatorName}</strong> from
        Türkiye, with a primary audience in the United States.
      </LegalParagraph>

      <LegalParagraph>
        Some product links on this site are affiliate links. We may earn a
        commission when you shop through them, at no extra cost to you. See our{" "}
        <Link href="/affiliate-disclosure" className="text-jet-black underline">
          Affiliate Disclosure
        </Link>
        .
      </LegalParagraph>

      <LegalHeading>Contact</LegalHeading>
      <LegalParagraph>
        General inquiries:{" "}
        <a
          href={`mailto:${siteLegal.contactEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.contactEmail}
        </a>
      </LegalParagraph>
    </LegalPageShell>
  );
}
