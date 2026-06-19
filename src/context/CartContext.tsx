"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface CartContextValue {
  cartItems: string[];
  count: number;
  bounceKey: number;
  isInCart: (lookId: string) => boolean;
  toggleCartItem: (lookId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [bounceKey, setBounceKey] = useState(0);

  const isInCart = useCallback(
    (lookId: string) => cartItems.includes(lookId),
    [cartItems],
  );

  const toggleCartItem = useCallback((lookId: string) => {
    setCartItems((current) => {
      if (current.includes(lookId)) {
        return current.filter((id) => id !== lookId);
      }

      setBounceKey((key) => key + 1);
      return [...current, lookId];
    });
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      count: cartItems.length,
      bounceKey,
      isInCart,
      toggleCartItem,
    }),
    [cartItems, bounceKey, isInCart, toggleCartItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
