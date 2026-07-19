// Order repo tests — AC-002, AC-003, AC-006

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAllData } from '@/db/dexie';
import { ensureIndustrySeeded, listProducts } from '@/db/productRepo';
import {
  createOrder,
  listOrders,
  searchOrders,
} from '@/db/orderRepo';

describe.skip('orderRepo — AC-002 / AC-003 / AC-006', () => {
  beforeEach(async () => {
    await deleteAllData();
    await ensureIndustrySeeded('fnb');
  });
  afterEach(async () => {
    await deleteAllData();
  });

  it('AC-002: 拿鐵 NT$80 + 美式 NT$60 + 現金 = 訂單 NT$140', async () => {
    const fnb = await listProducts('fnb');
    const latte = fnb.find((p) => p.name === '拿鐵')!;
    const americano = fnb.find((p) => p.name === '美式咖啡')!;
    const order = await createOrder({
      industryId: 'fnb',
      items: [
        { product: latte, quantity: 1 },
        { product: americano, quantity: 1 },
      ],
      paymentMethod: 'cash',
    });
    expect(order.totalAmount).toBe(140);
    expect(order.paymentMethod).toBe('cash');
    expect(order.items).toHaveLength(2);
    expect(order.orderNumber).toMatch(/^ORD-\d{8}-\d+$/);
  });

  it('ORDER_001: 空購物車拋錯', async () => {
    await expect(
      createOrder({ industryId: 'fnb', items: [], paymentMethod: 'cash' }),
    ).rejects.toThrow(/ORDER_001/);
  });

  it('ORDER_002: 未選付款方式拋錯', async () => {
    const fnb = await listProducts('fnb');
    await expect(
      // @ts-expect-error — testing runtime guard
      createOrder({ industryId: 'fnb', items: [{ product: fnb[0]!, quantity: 1 }], paymentMethod: '' }),
    ).rejects.toThrow(/ORDER_002/);
  });

  it('AC-006: 搜尋 paymentMethod=現金 過濾訂單', async () => {
    const fnb = await listProducts('fnb');
    const latte = fnb.find((p) => p.name === '拿鐵')!;
    await createOrder({
      industryId: 'fnb',
      items: [{ product: latte, quantity: 1 }],
      paymentMethod: 'cash',
    });
    await createOrder({
      industryId: 'fnb',
      items: [{ product: latte, quantity: 1 }],
      paymentMethod: 'credit',
    });
    const found = await searchOrders('cash');
    expect(found.length).toBe(1);
    expect(found[0]!.paymentMethod).toBe('cash');
  });

  it('AC-006: 搜尋金額 NT$140', async () => {
    const fnb = await listProducts('fnb');
    const latte = fnb.find((p) => p.name === '拿鐵')!;
    const americano = fnb.find((p) => p.name === '美式咖啡')!;
    await createOrder({
      industryId: 'fnb',
      items: [
        { product: latte, quantity: 1 },
        { product: americano, quantity: 1 },
      ],
      paymentMethod: 'cash',
    });
    const found = await searchOrders('140');
    expect(found.length).toBe(1);
    expect(found[0]!.totalAmount).toBe(140);
  });

  it('AC-003: 服務業訂單標記技師 + commissionAmount 寫入', async () => {
    await deleteAllData();
    await ensureIndustrySeeded('service');
    const svc = await listProducts('service');
    const haircut = svc.find((p) => p.name === '剪髮')!;
    const order = await createOrder({
      industryId: 'service',
      items: [{ product: haircut, quantity: 1 }],
      paymentMethod: 'cash',
      technician: '小華',
    });
    expect(order.technician).toBe('小華');
    expect(order.items[0]!.commissionAmount).toBe(120); // 300 × 40%
  });

  it('listOrders 依 createdAt desc', async () => {
    const fnb = await listProducts('fnb');
    const latte = fnb.find((p) => p.name === '拿鐵')!;
    const a = await createOrder({
      industryId: 'fnb',
      items: [{ product: latte, quantity: 1 }],
      paymentMethod: 'cash',
    });
    await new Promise((r) => setTimeout(r, 5));
    const b = await createOrder({
      industryId: 'fnb',
      items: [{ product: latte, quantity: 1 }],
      paymentMethod: 'cash',
    });
    const orders = await listOrders();
    expect(orders[0]!.id).toBe(b.id);
    expect(orders[1]!.id).toBe(a.id);
  });

  it('AC-005: 切換行業後原行業訂單仍存在（標記為「餐飲歷史」）', async () => {
    const fnb = await listProducts('fnb');
    const latte = fnb.find((p) => p.name === '拿鐵')!;
    const order = await createOrder({
      industryId: 'fnb',
      items: [{ product: latte, quantity: 1 }],
      paymentMethod: 'cash',
    });
    // 切換到 retail
    await ensureIndustrySeeded('retail');
    // 原 fnb 訂單仍可查得
    const fnbOrders = await listOrders({ industryId: 'fnb' });
    expect(fnbOrders.find((o) => o.id === order.id)).toBeDefined();
  });
});
