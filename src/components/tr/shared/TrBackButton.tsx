"use client";

import { useRouter } from "next/navigation";
import {
  useTransition,
  type ReactNode,
} from "react";
import { trCanGoBack, writeTrScroll } from "@/lib/tr/scrollMemory";

interface TrBackButtonProps {
  /** Used when there is no in-app history (direct land / refresh). */
  fallbackHref: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Returns to the previous in-app page (with scroll restore via TrScrollRestoration).
 * Falls back to `fallbackHref` when the user did not navigate here from /tr.
 */
export function TrBackButton({
  fallbackHref,
  className,
  children = "← Geri",
}: TrBackButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    writeTrScroll(
      window.location.pathname.replace(/\/$/, "") || "/",
      window.scrollY,
    );

    const canBack = trCanGoBack() && window.history.length > 1;
    startTransition(() => {
      if (canBack) {
        router.back();
        return;
      }
      router.push(fallbackHref);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={isPending ? { opacity: 0.65 } : undefined}
      aria-busy={isPending || undefined}
    >
      {children}
    </button>
  );
}
