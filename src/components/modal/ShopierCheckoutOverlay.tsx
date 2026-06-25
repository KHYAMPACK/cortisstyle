"use client";

import { AnimatePresence, motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface ShopierCheckoutOverlayProps {
  isOpen: boolean;
  shopierUrl: string;
  lookTitle: string;
  onClose: () => void;
}

export function ShopierCheckoutOverlay({
  isOpen,
  shopierUrl,
  lookTitle,
  onClose,
}: ShopierCheckoutOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="shopier-checkout"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={spring}
          className="absolute inset-0 z-30 flex flex-col bg-white"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <div>
              <p className="text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                Secure Checkout
              </p>
              <p className="mt-1 font-serif text-sm text-neutral-900">
                {lookTitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] tracking-[0.3em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
            >
              Back
            </button>
          </div>

          <iframe
            src={shopierUrl}
            title={`Shopier checkout for ${lookTitle}`}
            className="min-h-0 flex-1 w-full border-0"
            allow="payment"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
