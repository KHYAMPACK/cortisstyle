"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";

const iconTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

interface PurchaseActionBarProps {
  lookId: string;
  guidePrice: number;
  onPurchase: () => void;
}

export function PurchaseActionBar({
  lookId,
  guidePrice,
  onPurchase,
}: PurchaseActionBarProps) {
  const { cartItems, toggleCartItem } = useCart();
  const isInCart = cartItems.includes(lookId);

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={onPurchase}
        className="btn-primary flex-1 border border-jet-black px-6 py-4 text-center font-mono text-[10px] tracking-[0.3em]"
      >
        Purchase Style Guide — {guidePrice} TL
      </button>

      <button
        type="button"
        aria-label={
          isInCart ? "Remove style guide from cart" : "Add style guide to cart"
        }
        aria-pressed={isInCart}
        onClick={() => toggleCartItem(lookId)}
        className={`flex aspect-square w-[52px] shrink-0 items-center justify-center overflow-hidden border border-jet-black transition-colors duration-200 ${
          isInCart
            ? "bg-jet-black text-white hover:bg-neutral-800"
            : "bg-canvas-paper text-jet-black hover:bg-jet-black hover:text-white"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isInCart ? (
            <motion.span
              key="check"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={iconTransition}
              className="flex items-center justify-center"
            >
              <Check strokeWidth={1.5} className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="plus"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={iconTransition}
              className="flex items-center justify-center"
            >
              <Plus strokeWidth={1.5} className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
