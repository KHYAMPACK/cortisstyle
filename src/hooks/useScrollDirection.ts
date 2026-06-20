"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_THRESHOLD = 60;

/**
 * Returns whether the reactive center brand mark should be visible.
 * Past the threshold, scrolling down hides it; any upward scroll reveals it.
 */
export function useScrollDirection(threshold = DEFAULT_THRESHOLD) {
  const [showBrand, setShowBrand] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= threshold) {
        setShowBrand(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowBrand(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowBrand(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold]);

  return showBrand;
}
