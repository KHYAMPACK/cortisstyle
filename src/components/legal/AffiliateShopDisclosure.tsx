import Link from "next/link";

interface AffiliateShopDisclosureProps {
  showAmazonSentence?: boolean;
  className?: string;
}

export function AffiliateShopDisclosure({
  showAmazonSentence = false,
  className = "",
}: AffiliateShopDisclosureProps) {
  return (
    <div
      className={`border border-blueprint-border bg-white/80 px-3 py-3 ${className}`}
    >
      <p className="text-[10px] leading-relaxed text-meta">
        Some links on this page are affiliate links. If you buy through them,
        Cortisstyle may earn a commission at no extra cost to you. See our{" "}
        <Link
          href="/affiliate-disclosure"
          className="text-jet-black underline underline-offset-2"
        >
          Affiliate Disclosure
        </Link>{" "}
        for details.
      </p>
      {showAmazonSentence ? (
        <p className="mt-2 text-[10px] leading-relaxed text-neutral-800">
          As an Amazon Associate I earn from qualifying purchases.
        </p>
      ) : null}
    </div>
  );
}
