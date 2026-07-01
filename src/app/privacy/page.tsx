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
  title: "Privacy Policy — Cortisstyle",
  description: "How Cortisstyle collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <LegalParagraph>
        {siteLegal.siteName} operates <strong>cortisstyle.com</strong> and related
        subdomains (including <strong>studio.cortisstyle.com</strong>). This Privacy
        Policy explains what information we collect, how we use it, and your choices.
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
        <br />
        <strong>Privacy requests:</strong>{" "}
        <a
          href={`mailto:${siteLegal.privacyEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.privacyEmail}
        </a>
      </LegalParagraph>

      <LegalHeading>1. Information we collect</LegalHeading>
      <LegalSubheading>Information you provide</LegalSubheading>
      <LegalList>
        <li>
          <strong>Account data:</strong> email address and authentication credentials
          when you sign up or log in (via Supabase Auth).
        </li>
        <li>
          <strong>Profile data:</strong> email stored in your profile record.
        </li>
        <li>
          <strong>Wardrobe data:</strong> looks you unlock, outfits you save, outfit
          names, mood words, layout preferences, and related metadata.
        </li>
        <li>
          <strong>Communications:</strong> emails you send us or addresses you submit
          for waitlists, drop alerts, or notifications.
        </li>
      </LegalList>

      <LegalSubheading>Information collected automatically</LegalSubheading>
      <LegalList>
        <li>
          <strong>Usage data:</strong> pages visited, referrers, device/browser type,
          and general interaction patterns via <strong>Vercel Analytics</strong> and{" "}
          <strong>Vercel Speed Insights</strong>.
        </li>
        <li>
          <strong>Cookies and similar technologies:</strong> authentication session
          cookies on <code>.cortisstyle.com</code> and local storage used for
          functional features (for example saved outfit fallback).
        </li>
      </LegalList>

      <LegalSubheading>Information from third parties</LegalSubheading>
      <LegalParagraph>
        Affiliate networks may provide aggregated reporting about link clicks and
        qualifying purchases. We do not receive your full payment card details from
        retailers.
      </LegalParagraph>

      <LegalHeading>2. How we use information</LegalHeading>
      <LegalParagraph>We use information to:</LegalParagraph>
      <LegalList>
        <li>Provide and maintain accounts, the digital wardrobe, and saved outfits.</li>
        <li>Authenticate you across cortisstyle.com and studio.cortisstyle.com.</li>
        <li>Improve site performance, content, and user experience.</li>
        <li>Measure traffic and referral sources.</li>
        <li>Operate affiliate programs and understand which content drives shopping activity.</li>
        <li>Respond to support and privacy requests.</li>
        <li>Send optional product or drop notifications if you opt in.</li>
        <li>Protect against abuse, fraud, and security incidents.</li>
      </LegalList>

      <LegalHeading>3. Legal bases (EEA/UK visitors)</LegalHeading>
      <LegalParagraph>Where GDPR applies, we rely on:</LegalParagraph>
      <LegalList>
        <li>
          <strong>Contract</strong> — to provide account and wardrobe features you
          request.
        </li>
        <li>
          <strong>Legitimate interests</strong> — site security, analytics, and
          improving our service.
        </li>
        <li>
          <strong>Consent</strong> — where required for non-essential cookies or
          marketing emails.
        </li>
      </LegalList>

      <LegalHeading>4. Sharing of information</LegalHeading>
      <LegalParagraph>
        We share information with service providers who help us run the site:
      </LegalParagraph>
      <LegalList>
        <li>
          <strong>Supabase</strong> — authentication, database, user profiles,
          wardrobe and outfit storage.
        </li>
        <li>
          <strong>Vercel</strong> — hosting, analytics, performance monitoring.
        </li>
        <li>
          <strong>Affiliate networks</strong> (Amazon, CJ, eBay, Etsy, etc.) —
          attribution of qualifying purchases via affiliate links.
        </li>
      </LegalList>
      <LegalParagraph>
        We do not sell your personal information. We may disclose information if
        required by law or to protect our rights, users, or the public.
      </LegalParagraph>

      <LegalHeading>5. International transfers</LegalHeading>
      <LegalParagraph>
        We and our providers may process data in countries other than your own
        (including the United States and the European Union, depending on hosting
        configuration). We take reasonable steps to protect data in line with this
        policy.
      </LegalParagraph>
      <LegalParagraph>
        <strong>Supabase region:</strong> {siteLegal.supabaseRegion}
      </LegalParagraph>

      <LegalHeading>6. Data retention</LegalHeading>
      <LegalParagraph>
        We retain account and wardrobe data while your account is active. You may
        request deletion of your account and associated data. Analytics data is
        retained in aggregated form according to our analytics providers&rsquo;
        policies.
      </LegalParagraph>

      <LegalHeading>7. Your rights</LegalHeading>
      <LegalParagraph>
        Depending on your location, you may have the right to access, correct, or
        delete your personal data; object to or restrict certain processing; withdraw
        consent where processing is consent-based; or lodge a complaint with a
        supervisory authority (EEA/UK) or apply under <strong>KVKK</strong> (Türkiye).
      </LegalParagraph>
      <LegalParagraph>
        To exercise these rights, contact{" "}
        <a
          href={`mailto:${siteLegal.privacyEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.privacyEmail}
        </a>
        . We may need to verify your identity.
      </LegalParagraph>

      <LegalHeading>8. Children</LegalHeading>
      <LegalParagraph>
        {siteLegal.siteName} is not directed at children under 13 (or under 16 where
        applicable). We do not knowingly collect personal information from children.
        Contact us to request deletion if you believe a child provided data.
      </LegalParagraph>

      <LegalHeading>9. Security</LegalHeading>
      <LegalParagraph>
        We use industry-standard measures through our providers (encryption in
        transit, access controls). No method of transmission or storage is 100%
        secure.
      </LegalParagraph>

      <LegalHeading>10. Third-party links</LegalHeading>
      <LegalParagraph>
        Our site links to external retailers and services. Their privacy practices
        are governed by their own policies. We are not responsible for third-party
        sites.
      </LegalParagraph>

      <LegalHeading>11. Changes</LegalHeading>
      <LegalParagraph>
        We may update this policy. We will post the new effective date at the top.
        Material changes may be communicated via the site or email where appropriate.
      </LegalParagraph>

      <LegalHeading>12. Contact</LegalHeading>
      <LegalParagraph>
        {siteLegal.operatorName}
        <br />
        Email:{" "}
        <a
          href={`mailto:${siteLegal.privacyEmail}`}
          className="text-jet-black underline underline-offset-2"
        >
          {siteLegal.privacyEmail}
        </a>
      </LegalParagraph>
    </LegalPageShell>
  );
}
