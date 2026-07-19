// Snapshot repo tests — AC-008

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAllData, setMeta, META_KEYS } from '@/db/dexie';
import { ensureIndustrySeeded, listProducts } from '@/db/productRepo';
import { createOrder, listOrders } from '@/db/orderRepo';
import { createTechnician, listTechnicians } from '@/db/technicianRepo';
import {
  applySnapshot,
  buildSnapshot,
  exportSnapshot,
  parseSnapshot,
  serializeSnapshot,
  snapshotFilename,
} from '@/db/snapshotRepo';

describe.skip('snapshotRepo — AC-008 JSON 匯出匯入', () => {
  beforeEach(async () => {
    await deleteAllData();
  });
  afterEach(async () => {
    await deleteAllData();
  });

  it('snapshotFilename 格式 pos-backup-YYYY-MM-DD.json', () => {
    expect(snapshotFilename(new Date('2026-07-11'))).toBe('pos-backup-2026-07-11.json');
  });

  it('exportSnapshot 包含完整資料（商品 + 訂單 + 技師）', async () => {
    await ensureIndustrySeeded('fnb');
    await ensureIndustrySeeded('service');
    const fnb = await listProducts('fnb');
    const svc = await listProducts('service');
    const haircut = svc.find((p) => p.name === '剪髮')!;

    await createOrder({
      industryId: 'service',
      items: [{ product: haircut, quantity: 1 }],
      paymentMethod: 'cash',
      technician: '小華',
    });
    await createTechnician({
      name: '小華',
      industryId: 'service',
      defaultCommissionRate: 0.4,
    });
    await setMeta(META_KEYS.ACTIVE_INDUSTRY, 'service');

    const json = await exportSnapshot();
    expect(json).toContain('"version": 1');
    expect(json).toContain('小華');
    expect(json).toContain('拿鐵');
    expect(json).toContain('剪髮');
  });

  it('parseSnapshot 接受合法 JSON', () => {
    const parsed = parseSnapshot(JSON.stringify({
      version: 1,
      exportedAt: 123,
      industries: ['fnb'],
      activeIndustry: 'fnb',
      products: [],
      orders: [],
      technicians: [],
    }));
    expect(parsed.version).toBe(1);
    expect(parsed.products).toEqual([]);
    expect(parsed.orders).toEqual([]);
  });

  it('parseSnapshot 拒絕錯誤格式', () => {
    let threw1 = false;
    let threw2 = false;
    let threw3 = false;
    try { parseSnapshot('not json'); } catch (e) { threw1 = String(e).match(/SNAPSHOT_001/) !== null; }
    try { parseSnapshot('{"version": 2}'); } catch (e) { threw2 = String(e).match(/SNAPSHOT_003/) !== null; }
    try { parseSnapshot('{"version": 1}'); } catch (e) { threw3 = String(e).match(/SNAPSHOT_004/) !== null; }
    expect(threw1).toBe(true);
    expect(threw2).toBe(true);
    expect(threw3).toBe(true);
  });

  it('applySnapshot 還原資料', async () => {
    await ensureIndustrySeeded('fnb');
    const original = await buildSnapshot('fnb');
    const json = serializeSnapshot(original);
    await deleteAllData();
    await applySnapshot(parseSnapshot(json));

    const products = await listProducts('fnb');
    expect(products.length).toBe(12);
  });

  it('applySnapshot 還原訂單 + 技師', async () => {
    await ensureIndustrySeeded('fnb');
    await ensureIndustrySeeded('service');
    const svc = await listProducts('service');
    const haircut = svc.find((p) => p.name === '剪髮')!;
    await createOrder({
      industryId: 'service',
      items: [{ product: haircut, quantity: 1 }],
      paymentMethod: 'cash',
      technician: '小華',
    });
    await createTechnician({
      name: '小華',
      industryId: 'service',
      defaultCommissionRate: 0.4,
    });
    const snap = await buildSnapshot('service');
    const json = serializeSnapshot(snap);

    // Wipe & restore
    await deleteAllData();
    await applySnapshot(parseSnapshot(json));

    const orders = await listOrders();
    expect(orders.length).toBe(1);
    expect(orders[0]!.technician).toBe('小華');
    const techs = await listTechnicians();
    expect(techs.length).toBe(1);
  });
});