"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useTransition,
  type MouseEvent,
  type ReactNode,
} from "react";
import { markTrCanGoBack, writeTrScroll } from "@/lib/tr/scrollMemory";

interface TrSoftNavLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
  role?: string;
  "aria-label"?: string;
  /** Called when navigation is accepted (e.g. close a drawer). */
  onNavigate?: () => void;
}

/** Instant chrome navigation — transition to destination without blocking UI. */
export function TrSoftNavLink({
  href,
  className,
  children,
  prefetch = true,
  role,
  "aria-label": ariaLabel,
  onNavigate,
}: TrSoftNavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    writeTrScroll(pathname, window.scrollY);
    markTrCanGoBack();
    onNavigate?.();
    startTransition(() => {
      router.push(href, href.includes("#") ? { scroll: false } : undefined);
    });
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={handleClick}
      className={className}
      role={role}
      style={isPending ? { opacity: 0.65 } : undefined}
      aria-busy={isPending || undefined}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
