import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalHeading,
  LegalList,
  LegalPageShell,
  LegalParagraph,
} from "@/components/legal/LegalPageShell";
import { siteLegal } from "@/lib/siteLegal";

export const metadata: Metadata = {
  title: "Terms of Use — Cortisstyle",
  description: "Terms governing use of cortisstyle.com and related services.",
};

export default function TermsOfUsePage() {
  return (
    <LegalPageShell title="Terms of Use">
      <LegalParagraph>
        Welcome to <strong>cortisstyle.com</strong>. By accessing or using this
        website, you agree to these Terms of Use. If you do not agree, do not use the
        site.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Operator:</strong> {siteLegal.operatorName}
        <br />
        <strong>Contact:</strong>{" "}
        <a
          href={`mailto:${siteLegal.contactEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.contactEmail}
        </a>
      </LegalParagraph>

      <LegalHeading>1. About the service</LegalHeading>
      <LegalParagraph>
        {siteLegal.siteName} provides an editorial fashion lookbook, outfit
        inspiration, and links to third-party retailers. The site may include a
        digital wardrobe and account features. Content is provided for{" "}
        <strong>informational and inspirational purposes</strong> only. We do not
        provide professional styling, financial, or legal advice.
      </LegalParagraph>

      <LegalHeading>2. Accounts</LegalHeading>
      <LegalParagraph>
        You may need an account to access certain features. You are responsible for
        providing accurate information, maintaining the security of your credentials,
        and activity under your account. We may suspend or terminate accounts that
        violate these terms or harm the service or other users.
      </LegalParagraph>

      <LegalHeading>3. Affiliate links and shopping</LegalHeading>
      <LegalParagraph>
        The site contains <strong>affiliate links</strong>. We may earn commission on
        qualifying purchases. See our{" "}
        <Link href="/affiliate-disclosure" className="text-jet-black underline">
          Affiliate Disclosure
        </Link>
        .
      </LegalParagraph>
      <LegalParagraph>
        Purchases are made directly with third-party retailers. We are not a party to
        those transactions. We do not guarantee product quality, sizing,
        authenticity (especially on marketplace listings), pricing, shipping times, or
        return policies.
      </LegalParagraph>

      <LegalHeading>4. User content</LegalHeading>
      <LegalParagraph>
        If you save outfits, upload mood imagery, or submit other content:
      </LegalParagraph>
      <LegalList>
        <li>You retain ownership of your content.</li>
        <li>
          You grant us a non-exclusive, worldwide license to host, display, and
          process that content solely to operate the service.
        </li>
        <li>
          You represent that you have the right to submit the content and that it does
          not violate others&rsquo; rights.
        </li>
      </LegalList>

      <LegalHeading>5. Intellectual property</LegalHeading>
      <LegalParagraph>
        The {siteLegal.siteName} name, branding, lookbook layouts, editorial
        presentation, and site design are owned by {siteLegal.operatorName} or
        licensors. You may not copy, scrape, redistribute, or commercially exploit
        site content without written permission. Product names, logos, and trademarks
        of retailers and brands belong to their respective owners.
      </LegalParagraph>

      <LegalHeading>6. Acceptable use</LegalHeading>
      <LegalParagraph>You agree not to:</LegalParagraph>
      <LegalList>
        <li>Use the site unlawfully or to harass others.</li>
        <li>Attempt unauthorized access to systems or accounts.</li>
        <li>Reverse engineer, overload, or disrupt the service.</li>
        <li>
          Use automated means to scrape content at scale without permission.
        </li>
      </LegalList>

      <LegalHeading>7. Disclaimers</LegalHeading>
      <LegalParagraph>
        THE SITE AND CONTENT ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
        AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
        INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT. We do not warrant that the site will be uninterrupted,
        error-free, or that product links will always be available, accurate, or
        current.
      </LegalParagraph>

      <LegalHeading>8. Limitation of liability</LegalHeading>
      <LegalParagraph>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, {siteLegal.operatorName.toUpperCase()}{" "}
        AND {siteLegal.siteName.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
        PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SITE OR THIRD-PARTY
        PURCHASES. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SITE SHALL NOT
        EXCEED THE GREATER OF (A) AMOUNTS YOU PAID US IN THE TWELVE MONTHS BEFORE THE
        CLAIM OR (B) ONE HUNDRED US DOLLARS (USD $100). Some jurisdictions do not
        allow certain limitations; in those cases, limitations apply to the fullest
        extent permitted.
      </LegalParagraph>

      <LegalHeading>9. Indemnity</LegalHeading>
      <LegalParagraph>
        You agree to indemnify and hold harmless {siteLegal.operatorName} from claims
        arising out of your misuse of the site or violation of these terms.
      </LegalParagraph>

      <LegalHeading>10. Governing law</LegalHeading>
      <LegalParagraph>
        These terms are governed by the laws of the <strong>{siteLegal.governingLaw}</strong>
        , without regard to conflict-of-law principles. Courts in that jurisdiction
        shall have exclusive venue, unless mandatory consumer protection laws in your
        country require otherwise.
      </LegalParagraph>

      <LegalHeading>11. Changes</LegalHeading>
      <LegalParagraph>
        We may modify these terms at any time. Updated terms are effective when
        posted. Continued use after changes constitutes acceptance.
      </LegalParagraph>

      <LegalHeading>12. Contact</LegalHeading>
      <LegalParagraph>
        Questions about these terms:{" "}
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
