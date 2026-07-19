// Snapshot export/import — JSON 備份 (PRD §3.1 F-009 + AC-008)

import { db, META_KEYS } from '@/db/dexie';
import type { AppSnapshot, Order, Product, Technician } from '@/types';
import type { IndustryId } from '@/types/industry';
import { getMeta, setMeta } from '@/db/dexie';
import { listAllProducts, ensureIndustrySeeded } from '@/db/productRepo';
import { listOrders } from '@/db/orderRepo';
import { listTechnicians } from '@/db/technicianRepo';

export const SNAPSHOT_VERSION = 1 as const;

export function buildSnapshot(activeIndustry: IndustryId): Promise<AppSnapshot> {
  return (async () => {
    const [products, orders, technicians] = await Promise.all([
      listAllProducts(),
      listOrders(),
      listTechnicians(),
    ]);
    return {
      version: SNAPSHOT_VERSION,
      exportedAt: Date.now(),
      industries: ['fnb', 'retail', 'service'],
      activeIndustry,
      products,
      orders,
      technicians,
    };
  })();
}

export function serializeSnapshot(snapshot: AppSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

export function parseSnapshot(json: string): AppSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error(`SNAPSHOT_001: JSON parse error — ${(e as Error).message}`);
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('SNAPSHOT_002: Invalid snapshot root');
  }
  const s = parsed as Partial<AppSnapshot>;
  if (s.version !== 1) {
    throw new Error(`SNAPSHOT_003: Unsupported snapshot version: ${s.version}`);
  }
  if (!Array.isArray(s.products) || !Array.isArray(s.orders)) {
    throw new Error('SNAPSHOT_004: Missing products/orders array');
  }
  return {
    version: 1,
    exportedAt: s.exportedAt ?? Date.now(),
    industries: Array.isArray(s.industries) ? s.industries : ['fnb', 'retail', 'service'],
    activeIndustry: (s.activeIndustry as IndustryId) ?? 'fnb',
    products: s.products as Product[],
    orders: s.orders as Order[],
    technicians: (s.technicians ?? []) as Technician[],
  };
}

export async function applySnapshot(snapshot: AppSnapshot): Promise<void> {
  await db.transaction('rw', [db.products, db.orders, db.technicians, db.meta], async () => {
    await db.products.clear();
    await db.orders.clear();
    await db.technicians.clear();

    if (snapshot.products.length) {
      for (const p of snapshot.products) await db.products.put(p);
    }
    if (snapshot.orders.length) {
      for (const o of snapshot.orders) await db.orders.put(o);
    }
    if (snapshot.technicians.length) {
      for (const t of snapshot.technicians) await db.technicians.put(t);
    }

    await setMeta(META_KEYS.ACTIVE_INDUSTRY, snapshot.activeIndustry);
    await setMeta(META_KEYS.HAS_SEEDED, true);
  });

  // Re-seed any missing industries
  for (const ind of snapshot.industries) {
    await ensureIndustrySeeded(ind);
  }
}

/**
 * Build a JSON snapshot file content (PRD §3.4 AC-008).
 */
export async function exportSnapshot(): Promise<string> {
  const active = (await getMeta<IndustryId>(META_KEYS.ACTIVE_INDUSTRY)) ?? 'fnb';
  const snap = await buildSnapshot(active);
  return serializeSnapshot(snap);
}

/**
 * Get filename for download (pos-backup-YYYY-MM-DD.json).
 */
export function snapshotFilename(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `pos-backup-${yyyy}-${mm}-${dd}.json`;
}
