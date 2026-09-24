"use client";

import NextLink from "next/link";
import { useState, type ComponentProps } from "react";

/**
 * Link for every in-page panel link (rows, back links, CTAs).
 *
 * Panel routes are dynamic, so the default `prefetch="auto"` only fetches down
 * to the loading boundary and a click still waits on the server. `prefetch`
 * true fetches the whole route into the client cache (5 min), which makes the
 * click instant. Doing that for every row in a 50-order list on load would be
 * wasteful, so the full prefetch is armed by intent — hover, focus or touch —
 * and nothing happens before that. Always-visible nav links pass `prefetch`
 * explicitly and skip this. Prefetching only runs in production builds.
 */
export function TrPanelLink({
  prefetch,
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...props
}: ComponentProps<typeof NextLink>) {
  const [intent, setIntent] = useState(false);

  return (
    <NextLink
      {...props}
      prefetch={prefetch ?? intent}
      onPointerEnter={(event) => {
        setIntent(true);
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
    />
  );
}
