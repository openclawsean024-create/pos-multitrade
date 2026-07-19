// Product repository — IndexedDB CRUD (PRD §3.1 F-003)

import { db } from '@/db/dexie';
import type { Product } from '@/types';
import type { IndustryId } from '@/types/industry';
import { getTemplateProducts } from '@/lib/templates';

export interface CreateProductInput {
  industryId: IndustryId;
  name: string;
  category: string;
  price: number;
  cost?: number | null;
  stock?: number | null;
  technician?: string | null;
  commissionRate?: number | null;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listProducts(industryId: IndustryId, opts?: { includeInactive?: boolean }): Promise<Product[]> {
  const rows = await db.products.where('industryId').equals(industryId).toArray();
  const filtered = opts?.includeInactive ? rows : rows.filter((p) => p.isActive);
  return filtered.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return db.products.get(id);
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (input.price < 0) {
    throw new Error('PRODUCT_001: 商品價格錯誤');
  }
  const product: Product = {
    id: uid(),
    industryId: input.industryId,
    name: input.name,
    category: input.category,
    price: input.price,
    cost: input.cost ?? null,
    stock: input.stock ?? null,
    isActive: true,
    isTemplate: false,
    sku: null,
    technician: input.technician ?? null,
    commissionRate: input.commissionRate ?? null,
    createdAt: Date.now(),
  };
  await db.products.put(product);
  return product;
}

export async function updateProduct(id: string, patch: Partial<Omit<Product, 'id'>>): Promise<Product | undefined> {
  const existing = await db.products.get(id);
  if (!existing) return undefined;
  const updated: Product = { ...existing, ...patch };
  if (updated.price < 0) {
    throw new Error('PRODUCT_001: 商品價格錯誤');
  }
  await db.products.put(updated);
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id);
}

export async function toggleProductActive(id: string): Promise<Product | undefined> {
  const existing = await db.products.get(id);
  if (!existing) return undefined;
  const updated: Product = { ...existing, isActive: !existing.isActive };
  await db.products.put(updated);
  return updated;
}

/**
 * Ensure template products are seeded for an industry.
 * Idempotent — if industry already has templates, skip.
 */
export async function ensureIndustrySeeded(industryId: IndustryId): Promise<Product[]> {
  const existing = await db.products.where({ industryId, isTemplate: true }).count();
  if (existing > 0) {
    return listProducts(industryId);
  }
  const templates = getTemplateProducts(industryId);
  // fake-indexeddb 6.x + Dexie 4.x bulkPut bug: use sequential puts
  for (const t of templates) {
    await db.products.put(t);
  }
  return listProducts(industryId);
}

/**
 * Get ALL products across all industries (for industry switching).
 * PRD §3.4 AC-005: 切換行業時原商品保留（隱藏但保留）。
 */
export async function listAllProducts(): Promise<Product[]> {
  return db.products.orderBy('createdAt').toArray();
}
