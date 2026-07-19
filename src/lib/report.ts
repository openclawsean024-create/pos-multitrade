// Monthly report generation (PRD §3.1 F-007 + AC-004)

import type { MonthlyReport, Order, OrderItem, Product } from '@/types';
import { aggregateEarningsByTechnician } from './commission';
import { yearMonthKey } from './orderNumber';

interface ReportOrder extends Order {
  items: (OrderItem & { product: Pick<Product, 'commissionRate'> })[];
}

// Normalize technician to required string|null|undefined for aggregation
function asOrderForAggregation(o: ReportOrder) {
  return {
    technician: o.technician ?? null,
    items: o.items,
  };
}

/**
 * Build a monthly report aggregating revenue, top product, and technician earnings.
 * PRD §3.1 AC-004:
 *   30 天訂單 100 筆 → 總營業額 / 訂單數 / 熱賣第 1 / 熱賣第 2
 */
export function buildMonthlyReport(orders: ReportOrder[], yearMonth?: string): MonthlyReport {
  if (orders.length === 0) {
    return {
      yearMonth: yearMonth ?? yearMonthKey(new Date()),
      totalRevenue: 0,
      totalOrders: 0,
      topProductName: null,
      topProductRevenue: 0,
      topProductQuantity: 0,
      technicianEarnings: [],
    };
  }

  const ym = yearMonth ?? yearMonthKey(new Date(orders[0]!.createdAt));

  let totalRevenue = 0;
  const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();

  for (const order of orders) {
    totalRevenue += order.totalAmount;
    for (const item of order.items) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.revenue += item.subtotal;
        existing.quantity += item.quantity;
      } else {
        productMap.set(item.productId, {
          name: item.productName,
          revenue: item.subtotal,
          quantity: item.quantity,
        });
      }
    }
  }

  const sortedProducts = Array.from(productMap.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );
  const top = sortedProducts[0] ?? { name: '', revenue: 0, quantity: 0 };

  const earnings = aggregateEarningsByTechnician(orders.map(asOrderForAggregation));

  return {
    yearMonth: ym,
    totalRevenue,
    totalOrders: orders.length,
    topProductName: top.name || null,
    topProductRevenue: top.revenue,
    topProductQuantity: top.quantity,
    technicianEarnings: earnings.map((e) => ({
      technician: e.technician,
      earnings: e.totalEarnings,
    })),
  };
}

/**
 * Get the top-N products by revenue from orders.
 * Helper for "熱賣排行" UI.
 */
export function getTopProducts(
  orders: ReportOrder[],
  n = 5,
): Array<{ name: string; revenue: number; quantity: number }> {
  const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.revenue += item.subtotal;
        existing.quantity += item.quantity;
      } else {
        productMap.set(item.productId, {
          name: item.productName,
          revenue: item.subtotal,
          quantity: item.quantity,
        });
      }
    }
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n);
}
