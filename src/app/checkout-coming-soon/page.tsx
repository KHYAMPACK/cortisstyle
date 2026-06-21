import { Suspense } from "react";
import { CheckoutComingSoonGate } from "@/components/CheckoutComingSoonGate";

export default function CheckoutComingSoonPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutComingSoonGate />
    </Suspense>
  );
}
