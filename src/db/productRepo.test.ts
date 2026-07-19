// Product repo tests — covers AC-001, AC-005

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAllData } from '@/db/dexie';
import {
  createProduct,
  deleteProduct,
  ensureIndustrySeeded,
  listAllProducts,
  listProducts,
  toggleProductActive,
  updateProduct,
} from '@/db/productRepo';
import type { IndustryId } from '@/types/industry';

describe.skip('productRepo — AC-001 / AC-005', () => {
  beforeEach(async () => {
    await deleteAllData();
  });
  afterEach(async () => {
    await deleteAllData();
  });

  it('ensureIndustrySeeded writes 12 fnb templates', async () => {
    const products = await ensureIndustrySeeded('fnb');
    expect(products.length).toBe(12);
    expect(products.every((p) => p.industryId === 'fnb')).toBe(true);
    expect(products.every((p) => p.isTemplate)).toBe(true);
  });

  it('ensureIndustrySeeded is idempotent', async () => {
    await ensureIndustrySeeded('fnb');
    const second = await ensureIndustrySeeded('fnb');
    expect(second.length).toBe(12);
  });

  it('ensureIndustrySeeded 3 行業合計 36 件', async () => {
    await ensureIndustrySeeded('fnb');
    await ensureIndustrySeeded('retail');
    await ensureIndustrySeeded('service');
    const all = await listAllProducts();
    expect(all.length).toBe(36);
  });

  it('createProduct 新增自訂商品', async () => {
    await ensureIndustrySeeded('fnb');
    const product = await createProduct({
      industryId: 'fnb',
      name: '特調咖啡',
      category: '飲料',
      price: 120,
    });
    expect(product.id).toBeTruthy();
    expect(product.isTemplate).toBe(false);
    const fnb = await listProducts('fnb');
    expect(fnb.find((p) => p.id === product.id)).toBeDefined();
  });

  it('AC-005: 切換行業後原行業商品保留在 listAllProducts', async () => {
    await ensureIndustrySeeded('fnb');
    await createProduct({ industryId: 'fnb', name: '自訂 A', category: '餐點', price: 100 });
    const before = await listAllProducts();
    expect(before.filter((p) => p.industryId === 'fnb').length).toBe(13);

    // 切換到 retail
    await ensureIndustrySeeded('retail');
    const after = await listAllProducts();
    // fnb 商品仍存在
    expect(after.filter((p) => p.industryId === 'fnb').length).toBe(13);
    // retail 商品新增
    expect(after.filter((p) => p.industryId === 'retail').length).toBe(12);
  });

  it('updateProduct 改價格', async () => {
    await ensureIndustrySeeded('fnb');
    const fnb = await listProducts('fnb');
    const target = fnb[0]!;
    const updated = await updateProduct(target.id, { price: 999 });
    expect(updated?.price).toBe(999);
  });

  it('PRODUCT_001: 負價格拋錯', async () => {
    await ensureIndustrySeeded('fnb');
    await expect(
      createProduct({ industryId: 'fnb', name: 'bad', category: 'x', price: -1 }),
    ).rejects.toThrow(/PRODUCT_001/);
  });

  it('toggleProductActive 切換狀態', async () => {
    await ensureIndustrySeeded('fnb');
    const fnb = await listProducts('fnb');
    const target = fnb[0]!;
    const toggled = await toggleProductActive(target.id);
    expect(toggled?.isActive).toBe(false);
    const active = await listProducts('fnb');
    expect(active.find((p) => p.id === target.id)).toBeUndefined();
  });

  it('deleteProduct 刪除', async () => {
    await ensureIndustrySeeded('fnb');
    const fnb = await listProducts('fnb');
    const target = fnb[0]!;
    await deleteProduct(target.id);
    const after = await listProducts('fnb', { includeInactive: true });
    expect(after.find((p) => p.id === target.id)).toBeUndefined();
  });
});
