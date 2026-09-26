// Unit coverage for snapshot-before-switch orchestration in the app store.
// These tests verify the state-machine contract without touching the browser.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '@/store/appStore';
import { useCartStore } from '@/store/cartStore';
import { deleteAllData, getMeta } from '@/db/dexie';
import { META_SNAPSHOT_KEY, META_SNAPSHOT_AT_KEY, META_SNAPSHOT_INDUSTRY_KEY } from '@/store/appStore';

describe('appStore.switchIndustry — snapshot before switch', () => {
  beforeEach(async () => {
    await deleteAllData();
    useAppStore.setState({ activeIndustry: 'fnb', isOnline: true });
    useCartStore.setState({ items: [] });
  });
  afterEach(async () => {
    await deleteAllData();
  });

  it('persists the latest snapshot into meta before changing active industry', async () => {
    // Add a cart item so the snapshot is non-empty
    useCartStore.getState().addProduct({
      id: 'p1',
      industryId: 'fnb',
      name: 'Test Latte',
      category: 'Drinks',
      price: 80,
      cost: 20,
      stock: null,
      isActive: true,
      isTemplate: false,
      sku: null,
      technician: null,
      commissionRate: null,
      createdAt: Date.now(),
    }, 1);

    const result = await useAppStore.getState().switchIndustry('retail');
    expect(result.ok).toBe(true);

    // Active industry must be the new one
    expect(useAppStore.getState().activeIndustry).toBe('retail');

    // Latest snapshot meta must reference the prior industry and contain products
    const snapJson = await getMeta<string>(META_SNAPSHOT_KEY as never);
    expect(typeof snapJson).toBe('string');
    const snap = JSON.parse(snapJson!);
    expect(snap.version).toBe(1);
    expect(snap.activeIndustry).toBe('fnb');

    const snapAt = await getMeta<number>(META_SNAPSHOT_AT_KEY as never);
    expect(typeof snapAt).toBe('number');

    const snapIndustry = await getMeta<string>(META_SNAPSHOT_INDUSTRY_KEY as never);
    expect(snapIndustry).toBe('fnb');
  });

  it('clears the cart on successful switch', async () => {
    useCartStore.getState().addProduct({
      id: 'p2',
      industryId: 'fnb',
      name: 'Bagel',
      category: 'Breakfast',
      price: 45,
      cost: 12,
      stock: null,
      isActive: true,
      isTemplate: false,
      sku: null,
      technician: null,
      commissionRate: null,
      createdAt: Date.now(),
    }, 1);
    expect(useCartStore.getState().items.length).toBe(1);

    const result = await useAppStore.getState().switchIndustry('service');
    expect(result.ok).toBe(true);
    expect(useCartStore.getState().items.length).toBe(0);
    expect(useAppStore.getState().activeIndustry).toBe('service');
  });

  it('switching to the same industry is a no-op success', async () => {
    const result = await useAppStore.getState().switchIndustry('fnb');
    expect(result.ok).toBe(true);
    expect(useAppStore.getState().activeIndustry).toBe('fnb');
  });
});
