// Pricing tests — covers AC-002 (cart mechanics) and edge cases

import { describe, it, expect } from 'vitest';
import {
  buildCartItem,
  computeCartTotal,
  computeLineSubtotal,
  mergeCartItem,
  removeCartItem,
  setCartItemQuantity,
} from '@/lib/pricing';
import type { Product } from '@/types';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  industryId: 'fnb',
  name: '拿鐵',
  category: '飲料',
  price: 80,
  cost: null,
  stock: null,
  isActive: true,
  isTemplate: true,
  sku: null,
  technician: null,
  commissionRate: null,
  createdAt: 1000,
  ...overrides,
});

describe('pricing — AC-002 三欄 POS 結帳', () => {
  it('computeLineSubtotal: 拿鐵 NT$80 × 2 = NT$160', () => {
    expect(computeLineSubtotal(product(), 2)).toBe(160);
  });

  it('computeLineSubtotal: 美式 NT$60 × 1 = NT$60', () => {
    expect(computeLineSubtotal(product({ price: 60, name: '美式咖啡' }), 1)).toBe(60);
  });

  it('buildCartItem 計算 subtotal', () => {
    const item = buildCartItem(product(), 3);
    expect(item.subtotal).toBe(240);
    expect(item.quantity).toBe(3);
  });

  it('computeCartTotal 加總 NT$140 = 拿鐵 NT$80 + 美式 NT$60', () => {
    const items = [
      buildCartItem(product(), 1), // 80
      buildCartItem(product({ id: 'p2', name: '美式咖啡', price: 60 }), 1), // 60
    ];
    expect(computeCartTotal(items)).toBe(140);
  });

  it('ORDER_001: 空購物車拋錯', () => {
    expect(() => computeCartTotal([])).toThrow(/ORDER_001/);
  });

  it('PRODUCT_001: 負價格拋錯', () => {
    expect(() => computeLineSubtotal(product({ price: -10 }), 1)).toThrow(/PRODUCT_001/);
  });

  it('CART_001: 0 數量拋錯', () => {
    expect(() => computeLineSubtotal(product(), 0)).toThrow(/CART_001/);
  });

  it('mergeCartItem 合併同商品', () => {
    const items = [buildCartItem(product(), 1)];
    const merged = mergeCartItem(items, buildCartItem(product(), 2));
    expect(merged).toHaveLength(1);
    expect(merged[0]!.quantity).toBe(3);
    expect(merged[0]!.subtotal).toBe(240);
  });

  it('mergeCartItem 加入新商品', () => {
    const items = [buildCartItem(product({ id: 'p1' }), 1)];
    const merged = mergeCartItem(items, buildCartItem(product({ id: 'p2', price: 60 }), 1));
    expect(merged).toHaveLength(2);
  });

  it('removeCartItem 移除商品', () => {
    const items = [buildCartItem(product({ id: 'p1' }), 1), buildCartItem(product({ id: 'p2' }), 1)];
    expect(removeCartItem(items, 'p1')).toHaveLength(1);
    expect(removeCartItem(items, 'p1')[0]!.productId).toBe('p2');
  });

  it('setCartItemQuantity 更新數量', () => {
    const items = [buildCartItem(product(), 1)];
    const updated = setCartItemQuantity(items, 'p1', 5);
    expect(updated[0]!.quantity).toBe(5);
    expect(updated[0]!.subtotal).toBe(400);
  });

  it('setCartItemQuantity 0 = 移除', () => {
    const items = [buildCartItem(product(), 1)];
    expect(setCartItemQuantity(items, 'p1', 0)).toHaveLength(0);
  });
});
