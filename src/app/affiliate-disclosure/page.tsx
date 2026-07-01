import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalHeading,
  LegalList,
  LegalPageShell,
  LegalParagraph,
  LegalSubheading,
} from "@/components/legal/LegalPageShell";
import { siteLegal } from "@/lib/siteLegal";

export const metadata: Metadata = {
  title: "Affiliate Disclosure — Cortisstyle",
  description:
    "How Cortisstyle earns commission through affiliate links on cortisstyle.com.",
};

export default function AffiliateDisclosurePage() {
  return (
    <LegalPageShell title="Affiliate Disclosure">
      <LegalParagraph>
        {siteLegal.siteName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates{" "}
        <strong>cortisstyle.com</strong>. Transparency about how we earn money is
        important to us.
      </LegalParagraph>

      <LegalHeading>Affiliate relationships</LegalHeading>
      <LegalParagraph>
        Some links on this website — including product links shown in our looks,
        wardrobe, and editorial pages — are <strong>affiliate links</strong>. This
        means:
      </LegalParagraph>
      <LegalList>
        <li>
          If you click a link and make a qualifying purchase, we may receive a
          commission from the retailer or affiliate network.
        </li>
        <li>
          <strong>You do not pay more</strong> because you used our link. In some
          cases, offers may differ from what you would see by visiting the retailer
          directly.
        </li>
        <li>
          We participate in affiliate programs including, but not limited to,{" "}
          <strong>Amazon Associates</strong>, <strong>CJ Affiliate</strong>,{" "}
          <strong>eBay Partner Network</strong>, and <strong>Etsy Affiliate</strong>,
          and may add other programs over time.
        </li>
      </LegalList>

      <LegalHeading>Amazon Associates</LegalHeading>
      <LegalParagraph>
        <strong>As an Amazon Associate I earn from qualifying purchases.</strong>
      </LegalParagraph>

      <LegalHeading>Editorial independence</LegalHeading>
      <LegalParagraph>
        Affiliate relationships do not dictate our editorial choices. Looks are
        curated for aesthetic and editorial reasons. Commission potential does not
        determine which pieces we feature, though we may prioritize retailers that
        ship to our audience (primarily the United States) and that offer reliable
        shopping experiences.
      </LegalParagraph>

      <LegalHeading>Third-party retailers</LegalHeading>
      <LegalParagraph>
        We do not own, operate, or control linked retailers. Product availability,
        pricing, shipping, returns, and customer service are handled solely by the
        third party. We are not responsible for errors on retailer sites,
        out-of-stock items, or changes made after we publish a look.
      </LegalParagraph>

      <LegalHeading>Depop, marketplace, and one-off listings</LegalHeading>
      <LegalParagraph>
        Some links may point to third-party marketplaces (for example Depop) or
        independent shops. These may not be affiliate links. When an original item
        is unavailable, we may link to a similar product from another retailer,
        including affiliate retailers.
      </LegalParagraph>

      <LegalHeading>Updates</LegalHeading>
      <LegalParagraph>
        We may update this disclosure as our programs change. Continued use of the
        site after updates constitutes acceptance of the revised disclosure.
      </LegalParagraph>

      <LegalHeading>Contact</LegalHeading>
      <LegalParagraph>
        Questions about this disclosure:{" "}
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
