"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface EditorGuideOverlayProps {
  src: string;
  alt: string;
}

export function EditorGuideOverlay({ src, alt }: EditorGuideOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ ...spring, duration: 0.45 }}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 45vw, 26vw"
        className="object-contain object-center opacity-20 blur-[2px] grayscale"
      />
    </motion.div>
  );
}
