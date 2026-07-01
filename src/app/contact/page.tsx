import type { Metadata } from "next";
import {
  LegalHeading,
  LegalPageShell,
  LegalParagraph,
} from "@/components/legal/LegalPageShell";
import { siteLegal } from "@/lib/siteLegal";

export const metadata: Metadata = {
  title: "Contact — Cortisstyle",
  description: "Contact Cortisstyle for general inquiries and privacy requests.",
};

export default function ContactPage() {
  return (
    <LegalPageShell title="Contact" kicker="Contact" showEffectiveDate={false}>
      <LegalParagraph>
        Reach the {siteLegal.siteName} team for general questions, partnership
        inquiries, or privacy requests.
      </LegalParagraph>

      <LegalHeading>General inquiries</LegalHeading>
      <LegalParagraph>
        <a
          href={`mailto:${siteLegal.contactEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.contactEmail}
        </a>
      </LegalParagraph>

      <LegalHeading>Privacy requests</LegalHeading>
      <LegalParagraph>
        For access, correction, or deletion requests under GDPR or KVKK:{" "}
        <a
          href={`mailto:${siteLegal.privacyEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.privacyEmail}
        </a>
      </LegalParagraph>

      <LegalParagraph>
        We aim to respond within a few business days.
      </LegalParagraph>

      <LegalHeading>Operator</LegalHeading>
      <LegalParagraph>
        {siteLegal.siteName} is an editorial fashion lookbook operated by{" "}
        <strong>{siteLegal.operatorName}</strong>.
      </LegalParagraph>
      <LegalParagraph>
        Primary audience: United States. Operator based in Türkiye.
      </LegalParagraph>
    </LegalPageShell>
  );
}
