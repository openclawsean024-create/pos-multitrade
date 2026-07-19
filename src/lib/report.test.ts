// Monthly report — AC-004

import { describe, it, expect } from 'vitest';
import { buildMonthlyReport, getTopProducts } from '@/lib/report';
import type { Order, OrderItem, Product } from '@/types';

const order = (
  id: string,
  total: number,
  createdAt: number,
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }>,
  technician: string | null = null,
): Order & { items: (OrderItem & { product: Pick<Product, 'commissionRate'> })[] } => ({
  id,
  orderNumber: `ORD-${id}`,
  industryId: 'fnb',
  totalAmount: total,
  paymentMethod: 'cash',
  customerNote: null,
  technician,
  createdAt,
  items: items.map((it, idx) => ({
    id: `${id}-item-${idx}`,
    orderId: id,
    productId: it.productId,
    productName: it.productName,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    subtotal: it.subtotal,
    product: { commissionRate: 0 },
  })),
});

describe('buildMonthlyReport — AC-004 月報表', () => {
  it('空訂單 = 零營業額', () => {
    const report = buildMonthlyReport([]);
    expect(report.totalRevenue).toBe(0);
    expect(report.totalOrders).toBe(0);
    expect(report.topProductName).toBeNull();
  });

  it('單筆訂單 — 總營業額 = 訂單金額', () => {
    const orders = [order('o1', 140, Date.now(), [
      { productId: 'latte', productName: '拿鐵', quantity: 1, unitPrice: 80, subtotal: 80 },
      { productId: 'americano', productName: '美式咖啡', quantity: 1, unitPrice: 60, subtotal: 60 },
    ])];
    const report = buildMonthlyReport(orders);
    expect(report.totalRevenue).toBe(140);
    expect(report.totalOrders).toBe(1);
  });

  it('AC-004: 100 筆訂單 → 熱賣第 1 為最高營收商品', () => {
    const baseTime = new Date('2026-07-01').getTime();
    const orders = [];
    // 100 筆：30 杯奶茶 + 200 杯美式 + 其他雜項
    for (let i = 0; i < 30; i++) {
      orders.push(order(`o${i}`, 50, baseTime + i * 1000, [
        { productId: 'milk-tea', productName: '奶茶', quantity: 1, unitPrice: 50, subtotal: 50 },
      ]));
    }
    for (let i = 30; i < 230; i++) {
      orders.push(order(`o${i}`, 60, baseTime + i * 1000, [
        { productId: 'americano', productName: '美式咖啡', quantity: 1, unitPrice: 60, subtotal: 60 },
      ]));
    }
    const report = buildMonthlyReport(orders, '2026-07');
    expect(report.totalOrders).toBe(230);
    // 美式 NT$60 × 200 = NT$12,000  > 奶茶 NT$50 × 30 = NT$1,500
    expect(report.topProductName).toBe('美式咖啡');
    expect(report.topProductRevenue).toBe(60 * 200);
    expect(report.topProductQuantity).toBe(200);
  });

  it('AC-004: top 2 = 奶茶 NT$1,500 (30 杯)', () => {
    const baseTime = new Date('2026-07-01').getTime();
    const orders = [];
    for (let i = 0; i < 30; i++) {
      orders.push(order(`o${i}`, 50, baseTime + i * 1000, [
        { productId: 'milk-tea', productName: '奶茶', quantity: 1, unitPrice: 50, subtotal: 50 },
      ]));
    }
    const top = getTopProducts(orders, 2);
    expect(top[0]!.name).toBe('奶茶');
    expect(top[0]!.quantity).toBe(30);
    expect(top[0]!.revenue).toBe(1500);
  });

  it('技師抽成出現在 report.technicianEarnings', () => {
    const baseTime = new Date('2026-07-01').getTime();
    const svc = order('s1', 1800, baseTime, [
      { productId: 'dye', productName: '染髮', quantity: 1, unitPrice: 1500, subtotal: 1500 },
      { productId: 'hair', productName: '美髮', quantity: 1, unitPrice: 300, subtotal: 300 },
    ], '小華');
    svc.items[0]!.product.commissionRate = 0.4;
    svc.items[1]!.product.commissionRate = 0.1;
    const report = buildMonthlyReport([svc], '2026-07');
    expect(report.technicianEarnings).toHaveLength(1);
    expect(report.technicianEarnings[0]!.technician).toBe('小華');
    expect(report.technicianEarnings[0]!.earnings).toBe(600 + 30);
  });
});

describe('getTopProducts', () => {
  it('回傳 top N by revenue', () => {
    const t = Date.now();
    const orders = [
      order('o1', 100, t, [{ productId: 'a', productName: 'A', quantity: 1, unitPrice: 100, subtotal: 100 }]),
      order('o2', 200, t, [{ productId: 'b', productName: 'B', quantity: 1, unitPrice: 200, subtotal: 200 }]),
      order('o3', 50, t, [{ productId: 'c', productName: 'C', quantity: 1, unitPrice: 50, subtotal: 50 }]),
    ];
    const top = getTopProducts(orders, 2);
    expect(top).toHaveLength(2);
    expect(top[0]!.name).toBe('B');
    expect(top[1]!.name).toBe('A');
  });

  it('同商品多筆訂單聚合 revenue', () => {
    const t = Date.now();
    const orders = [
      order('o1', 100, t, [{ productId: 'a', productName: 'A', quantity: 1, unitPrice: 100, subtotal: 100 }]),
      order('o2', 200, t, [{ productId: 'a', productName: 'A', quantity: 2, unitPrice: 100, subtotal: 200 }]),
    ];
    const top = getTopProducts(orders);
    expect(top[0]!.revenue).toBe(300);
    expect(top[0]!.quantity).toBe(3);
  });
});
