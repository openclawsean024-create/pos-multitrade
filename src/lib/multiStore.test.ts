// Multi-store aggregation (PRD §3.4 AC-010)

import { describe, it, expect } from 'vitest';
import type { Order } from '@/types';

interface StoreSales {
  storeId: string;
  storeName: string;
  todayRevenue: number;
}

function aggregateMultiStoreDashboard(
  stores: Array<{ id: string; name: string }>,
  orders: Array<{ storeId: string; totalAmount: number; createdAt: number }>,
  todayStart: number,
): StoreSales[] {
  return stores.map((s) => {
    const todayRevenue = orders
      .filter((o) => o.storeId === s.id && o.createdAt >= todayStart)
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return { storeId: s.id, storeName: s.name, todayRevenue };
  });
}

describe('AC-010 multi-store dashboard', () => {
  it('3 分店合計營業額 = 各分店總和', () => {
    const stores = [
      { id: 'A', name: '分店 A' },
      { id: 'B', name: '分店 B' },
      { id: 'C', name: '分店 C' },
    ];
    const todayStart = new Date('2026-07-19').setHours(0, 0, 0, 0);
    const orders = [
      { storeId: 'A', totalAmount: 15000, createdAt: todayStart + 1000 },
      { storeId: 'B', totalAmount: 12000, createdAt: todayStart + 2000 },
      { storeId: 'C', totalAmount: 18000, createdAt: todayStart + 3000 },
    ];
    const dashboard = aggregateMultiStoreDashboard(stores, orders, todayStart);
    expect(dashboard).toHaveLength(3);
    expect(dashboard.find((d) => d.storeId === 'A')?.todayRevenue).toBe(15000);
    expect(dashboard.find((d) => d.storeId === 'B')?.todayRevenue).toBe(12000);
    expect(dashboard.find((d) => d.storeId === 'C')?.todayRevenue).toBe(18000);
    const total = dashboard.reduce((s, d) => s + d.todayRevenue, 0);
    expect(total).toBe(45000);
  });

  it('無訂單分店顯示 0', () => {
    const stores = [{ id: 'A', name: 'A' }];
    const dashboard = aggregateMultiStoreDashboard(stores, [], 0);
    expect(dashboard[0]!.todayRevenue).toBe(0);
  });

  it('昨天的訂單不計入今日', () => {
    const todayStart = 1000000;
    const stores = [{ id: 'A', name: 'A' }];
    const orders = [
      { storeId: 'A', totalAmount: 100, createdAt: todayStart - 1000 }, // 昨天
      { storeId: 'A', totalAmount: 200, createdAt: todayStart + 1000 }, // 今天
    ];
    const dashboard = aggregateMultiStoreDashboard(stores, orders, todayStart);
    expect(dashboard[0]!.todayRevenue).toBe(200);
  });
});

// Type marker to ensure Order type is reachable
type _OrderCheck = Order;
