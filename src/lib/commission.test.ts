// Commission tests — AC-003 (single order) + AC-007 (aggregated)

import { describe, it, expect } from 'vitest';
import {
  aggregateEarningsByTechnician,
  computeLineCommission,
  computeOrderCommissions,
  validateCommissionRate,
} from '@/lib/commission';
import type { Product } from '@/types';

const svcProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'svc',
  industryId: 'service',
  name: '剪髮',
  category: '美髮',
  price: 300,
  cost: null,
  stock: null,
  isActive: true,
  isTemplate: true,
  sku: null,
  technician: '小華',
  commissionRate: 0.4,
  createdAt: 1000,
  ...overrides,
});

describe('commission — AC-003 技師抽成計算', () => {
  it('剪髮 NT$300 × 40% = NT$120 抽成', () => {
    const amount = computeLineCommission({
      productName: '剪髮',
      product: { commissionRate: 0.4 },
      quantity: 1,
      unitPrice: 300,
      subtotal: 300,
    });
    expect(amount).toBe(120);
  });

  it('無抽成商品回傳 0', () => {
    const amount = computeLineCommission({
      productName: '其他',
      product: { commissionRate: undefined },
      quantity: 1,
      unitPrice: 100,
      subtotal: 100,
    });
    expect(amount).toBe(0);
  });
});

describe('commission — AC-007 技師薪資彙總', () => {
  it('染髮 NT$1,500 (40%) + 美髮 NT$500 (10%) = NT$650', () => {
    const orders = [
      {
        technician: '小華',
        items: [
          {
            productName: '染髮',
            product: { commissionRate: 0.4 },
            quantity: 1,
            unitPrice: 1500,
            subtotal: 1500,
          },
          {
            productName: '美髮',
            product: { commissionRate: 0.1 },
            quantity: 1,
            unitPrice: 500,
            subtotal: 500,
          },
        ],
      },
    ];
    const earnings = aggregateEarningsByTechnician(orders);
    expect(earnings).toHaveLength(1);
    expect(earnings[0]!.technician).toBe('小華');
    expect(earnings[0]!.totalEarnings).toBe(650);
  });

  it('多技師分別彙總', () => {
    const orders = [
      { technician: '小華', items: [{ productName: '剪髮', product: { commissionRate: 0.4 }, quantity: 1, unitPrice: 300, subtotal: 300 }] },
      { technician: '小美', items: [{ productName: '美甲', product: { commissionRate: 0.5 }, quantity: 1, unitPrice: 500, subtotal: 500 }] },
    ];
    const earnings = aggregateEarningsByTechnician(orders);
    expect(earnings).toHaveLength(2);
    const xiaohua = earnings.find((e) => e.technician === '小華');
    const xiaomei = earnings.find((e) => e.technician === '小美');
    expect(xiaohua?.totalEarnings).toBe(120);
    expect(xiaomei?.totalEarnings).toBe(250);
  });

  it('空訂單 = 空陣列', () => {
    expect(aggregateEarningsByTechnician([])).toEqual([]);
  });

  it('無技師訂單不計入', () => {
    const orders = [
      { technician: null, items: [{ productName: '餐點', product: { commissionRate: 0.4 }, quantity: 1, unitPrice: 100, subtotal: 100 }] },
    ];
    expect(aggregateEarningsByTechnician(orders)).toEqual([]);
  });

  it('依金額降冪排序', () => {
    const orders = [
      { technician: 'A', items: [{ productName: 'x', product: { commissionRate: 0.1 }, quantity: 1, unitPrice: 100, subtotal: 100 }] },
      { technician: 'B', items: [{ productName: 'y', product: { commissionRate: 0.5 }, quantity: 1, unitPrice: 500, subtotal: 500 }] },
    ];
    const earnings = aggregateEarningsByTechnician(orders);
    expect(earnings[0]!.technician).toBe('B');
    expect(earnings[1]!.technician).toBe('A');
  });
});

describe('commission — computeOrderCommissions', () => {
  it('回傳每行抽成 breakdown', () => {
    const items = [
      {
        productName: '剪髮',
        product: svcProduct(),
        quantity: 1,
        unitPrice: 300,
        subtotal: 300,
      },
    ];
    const breakdown = computeOrderCommissions(items);
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]!.commissionAmount).toBe(120);
  });
});

describe('commission — TECHNICIAN_001 抽成率驗證', () => {
  it('合法 0-1 範圍', () => {
    expect(() => validateCommissionRate(0)).not.toThrow();
    expect(() => validateCommissionRate(0.5)).not.toThrow();
    expect(() => validateCommissionRate(1)).not.toThrow();
  });

  it('負值拋錯', () => {
    expect(() => validateCommissionRate(-0.1)).toThrow(/TECHNICIAN_001/);
  });

  it('> 1 拋錯', () => {
    expect(() => validateCommissionRate(1.5)).toThrow(/TECHNICIAN_001/);
  });
});
