"use client";

import { Suspense } from "react";
import { ComingSoonGate } from "@/components/ComingSoonGate";

export default function WardrobeComingSoonPage() {
  return (
    <Suspense fallback={null}>
      <ComingSoonGate />
    </Suspense>
  );
}
