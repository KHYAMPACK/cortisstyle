"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AppShell } from "@/components/AppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <AppShell>{children}</AppShell>
      </CartProvider>
    </AuthProvider>
  );
}
