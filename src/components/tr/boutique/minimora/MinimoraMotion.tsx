"use client";

import { motion, type MotionProps } from "framer-motion";
import type { ReactNode } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};

export function MinimoraFadeIn({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div {...(fadeUp as MotionProps)} className={className}>
      {children}
    </motion.div>
  );
}
