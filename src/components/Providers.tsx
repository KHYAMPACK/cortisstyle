"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AppShell } from "@/components/AppShell";
import { IntroLoader } from "@/components/IntroLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <IntroLoader />
        <AppShell>{children}</AppShell>
      </CartProvider>
    </AuthProvider>
  );
}
