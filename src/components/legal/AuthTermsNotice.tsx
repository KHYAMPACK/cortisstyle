import Link from "next/link";

export function AuthTermsNotice() {
  return (
    <p className="mt-4 text-center text-[10px] leading-relaxed text-neutral-500">
      By continuing, you agree to our{" "}
      <Link href="/terms" className="text-neutral-700 underline underline-offset-2">
        Terms of Use
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="text-neutral-700 underline underline-offset-2">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
