import Link from "next/link";

interface AuthTermsNoticeProps {
  termsHref?: string;
  privacyHref?: string;
  locale?: "en" | "tr";
}

export function AuthTermsNotice({
  termsHref = "/terms",
  privacyHref = "/privacy",
  locale = "en",
}: AuthTermsNoticeProps) {
  if (locale === "tr") {
    return (
      <p className="mt-4 text-center text-[10px] leading-relaxed text-neutral-500">
        Devam ederek{" "}
        <Link
          href={termsHref}
          className="text-neutral-700 underline underline-offset-2"
        >
          üyelik şartlarını
        </Link>{" "}
        ve{" "}
        <Link
          href={privacyHref}
          className="text-neutral-700 underline underline-offset-2"
        >
          gizlilik politikasını
        </Link>{" "}
        kabul etmiş olursunuz.
      </p>
    );
  }

  return (
    <p className="mt-4 text-center text-[10px] leading-relaxed text-neutral-500">
      By continuing, you agree to our{" "}
      <Link
        href={termsHref}
        className="text-neutral-700 underline underline-offset-2"
      >
        Terms of Use
      </Link>{" "}
      and{" "}
      <Link
        href={privacyHref}
        className="text-neutral-700 underline underline-offset-2"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}
