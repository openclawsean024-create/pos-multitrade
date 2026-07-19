// Technician commission calculation (PRD §3.1 F-008 + AC-003 + AC-007)

import type { Product } from '@/types';

export interface CommissionBreakdown {
  productName: string;
  commissionRate: number;
  subtotal: number;
  commissionAmount: number;
}

/**
 * Compute commission for a single order line.
 * Returns 0 if product has no technician/commissionRate.
 */
export function computeLineCommission(item: {
  productName: string;
  product: Pick<Product, 'commissionRate'>;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}): number {
  const rate = item.product.commissionRate ?? 0;
  if (rate <= 0) return 0;
  return Math.round(item.subtotal * rate);
}

/**
 * Compute commission for an entire order, returning per-line breakdown.
 * Used to write to technician earnings.
 */
export function computeOrderCommissions(
  items: Array<{
    productName: string;
    product: Product;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>,
): CommissionBreakdown[] {
  return items
    .map((item) => ({
      productName: item.productName,
      commissionRate: item.product.commissionRate ?? 0,
      subtotal: item.subtotal,
      commissionAmount: computeLineCommission(item),
    }))
    .filter((b) => b.commissionAmount > 0);
}

/**
 * Aggregate earnings by technician from a list of order items.
 * PRD §3.1 AC-007: 美髮 NT$500 (10%) + 染髮 NT$1,500 (40%) = NT$650
 */
export interface TechnicianEarning {
  technician: string;
  totalEarnings: number;
  items: CommissionBreakdown[];
}

export interface OrderForAggregation {
  technician: string | null | undefined;
  items: Array<{
    productName: string;
    product: Pick<Product, 'commissionRate'>;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export function aggregateEarningsByTechnician(
  orders: OrderForAggregation[],
): TechnicianEarning[] {
  const map = new Map<string, TechnicianEarning>();

  for (const order of orders) {
    if (!order.technician) continue;
    const tech = order.technician;
    let entry = map.get(tech);
    if (!entry) {
      entry = { technician: tech, totalEarnings: 0, items: [] };
      map.set(tech, entry);
    }
    for (const item of order.items) {
      const rate = item.product.commissionRate ?? 0;
      if (rate <= 0) continue;
      const amount = Math.round(item.subtotal * rate);
      if (amount <= 0) continue;
      entry.totalEarnings += amount;
      entry.items.push({
        productName: item.productName,
        commissionRate: rate,
        subtotal: item.subtotal,
        commissionAmount: amount,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalEarnings - a.totalEarnings);
}

/**
 * Validate commission rate (PRD §10.4 TECHNICIAN_001).
 */
export function validateCommissionRate(rate: number): void {
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    throw new Error('TECHNICIAN_001: 技師抽成率錯誤 (must be 0-1)');
  }
}
