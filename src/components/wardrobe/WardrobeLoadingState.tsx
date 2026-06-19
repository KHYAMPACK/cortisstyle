"use client";

import { motion } from "framer-motion";

export function WardrobeLoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6">
      <motion.div
        aria-hidden
        className="h-8 w-8 border border-neutral-300 border-t-neutral-900"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-[10px] tracking-[0.35em] text-neutral-400 uppercase">
        {label}
      </p>
    </div>
  );
}
