// Cart store (Zustand) — three-column POS UI

import { create } from 'zustand';
import type { CartItem, Product } from '@/types';
import {
  buildCartItem,
  computeCartTotal,
  mergeCartItem,
  removeCartItem,
  setCartItemQuantity,
} from '@/lib/pricing';

interface CartState {
  items: CartItem[];
  addProduct: (product: Product, quantity?: number) => void;
  removeProduct: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addProduct: (product, quantity = 1) => {
    const newItem = buildCartItem(product, quantity);
    set({ items: mergeCartItem(get().items, newItem) });
  },
  removeProduct: (productId) => {
    set({ items: removeCartItem(get().items, productId) });
  },
  setQuantity: (productId, quantity) => {
    set({ items: setCartItemQuantity(get().items, productId, quantity) });
  },
  clear: () => set({ items: [] }),
  total: () => {
    try {
      return computeCartTotal(get().items);
    } catch {
      return 0;
    }
  },
  count: () => get().items.reduce((s, i) => s + i.quantity, 0),
}));
