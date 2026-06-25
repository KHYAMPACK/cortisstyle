"use client";

import { useRouter } from "next/navigation";
import { goToCheckoutGate, isPurchaseGateEnabled } from "@/lib/purchaseGateFlow";

interface PurchaseActionBarProps {
  lookId: string;
  guidePrice: number;
  onPurchase: () => void;
  onGateNavigate?: () => void;
}

export function PurchaseActionBar({
  lookId,
  guidePrice,
  onPurchase,
  onGateNavigate,
}: PurchaseActionBarProps) {
  const router = useRouter();

  const handlePurchase = () => {
    if (isPurchaseGateEnabled()) {
      goToCheckoutGate(lookId, router, onGateNavigate);
      return;
    }

    onPurchase();
  };

  return (
    <button
      type="button"
      onClick={handlePurchase}
      className="btn-primary w-full border border-jet-black px-6 py-4 text-center font-mono text-[10px] tracking-[0.3em]"
    >
      Purchase Style Guide — {guidePrice} TL
    </button>
  );
}
