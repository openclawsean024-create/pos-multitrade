// Pricing & cart logic — pure functions (no DB)

import type { CartItem, Product } from '@/types';

/**
 * Compute subtotal for a single cart line.
 * Throws if product price is invalid (PRD §10.4 PRODUCT_001).
 */
export function computeLineSubtotal(product: Product, quantity: number): number {
  if (!Number.isFinite(product.price) || product.price < 0) {
    throw new Error('PRODUCT_001: 商品價格錯誤');
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('CART_001: 數量必須為正整數');
  }
  return Math.round(product.price * quantity);
}

/**
 * Compute total amount for a cart.
 * Throws if cart is empty (PRD §10.4 ORDER_001).
 */
export function computeCartTotal(items: CartItem[]): number {
  if (items.length === 0) {
    throw new Error('ORDER_001: 購物車為空');
  }
  return items.reduce((sum, item) => sum + item.subtotal, 0);
}

/**
 * Build a cart line from a product and quantity (pure helper).
 */
export function buildCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    product,
    quantity,
    subtotal: computeLineSubtotal(product, quantity),
  };
}

/**
 * Merge a new line into cart. If same product exists, increment quantity.
 */
export function mergeCartItem(items: CartItem[], newItem: CartItem): CartItem[] {
  const idx = items.findIndex((i) => i.productId === newItem.productId);
  if (idx === -1) {
    return [...items, newItem];
  }
  const existing = items[idx]!;
  const mergedQty = existing.quantity + newItem.quantity;
  const merged: CartItem = {
    ...existing,
    quantity: mergedQty,
    subtotal: computeLineSubtotal(existing.product, mergedQty),
  };
  return items.map((it, i) => (i === idx ? merged : it));
}

/**
 * Remove item from cart by productId.
 */
export function removeCartItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((i) => i.productId !== productId);
}

/**
 * Update quantity of an item (set absolute qty). Removes if qty <= 0.
 */
export function setCartItemQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeCartItem(items, productId);
  return items.map((it) => {
    if (it.productId !== productId) return it;
    return { ...it, quantity, subtotal: computeLineSubtotal(it.product, quantity) };
  });
}
