// IndexedDB schema (PRD §4.3) — Dexie.js (ADR-002)

import Dexie, { type Table } from 'dexie';
import type {
  Order,
  Product,
  Technician,
} from '@/types';
import type { IndustryId } from '@/types/industry';

export interface AppMeta {
  key: string;
  value: unknown;
}

export interface ProductRow extends Product {}

export interface OrderRow extends Order {
  industryId: IndustryId;
}

export interface TechnicianRow extends Technician {}

export class PosDatabase extends Dexie {
  products!: Table<ProductRow, string>;
  orders!: Table<OrderRow, string>;
  technicians!: Table<TechnicianRow, string>;
  meta!: Table<AppMeta, string>;

  constructor(dbName = 'pos-multitrade') {
    super(dbName);
    this.version(1).stores({
      products: 'id, industryId, isActive, isTemplate, category, name, createdAt, [industryId+isTemplate]',
      orders: 'id, industryId, paymentMethod, createdAt, technician, orderNumber',
      technicians: 'id, name, industryId, createdAt',
      meta: 'key',
    });
  }
}

export const db = new PosDatabase();

export const META_KEYS = {
  ACTIVE_INDUSTRY: 'activeIndustry',
  HAS_SEEDED: 'hasSeeded',
  EXPORT_VERSION: 'exportVersion',
} as const;

export type MetaKey = (typeof META_KEYS)[keyof typeof META_KEYS];

export async function getMeta<T>(key: MetaKey): Promise<T | undefined> {
  const row = await db.meta.get(key);
  return row?.value as T | undefined;
}

export async function setMeta(key: MetaKey, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}

export async function deleteAllData(): Promise<void> {
  await db.transaction('rw', [db.products, db.orders, db.technicians, db.meta], async () => {
    await db.products.clear();
    await db.orders.clear();
    await db.technicians.clear();
    await db.meta.clear();
  });
}
