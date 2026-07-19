// Order repository — IndexedDB CRUD (PRD §3.1 F-006, AC-002, AC-006)

import { db } from '@/db/dexie';
import type { Order, OrderItem, PaymentMethod, Product } from '@/types';
import type { IndustryId } from '@/types/industry';
import { computeLineSubtotal } from '@/lib/pricing';
import { computeLineCommission } from '@/lib/commission';
import { formatOrderNumber } from '@/lib/orderNumber';

export interface CreateOrderInput {
  industryId: IndustryId;
  items: Array<{ product: Product; quantity: number }>;
  paymentMethod: PaymentMethod;
  technician?: string | null;
  customerNote?: string | null;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listOrders(opts?: { industryId?: IndustryId; limit?: number }): Promise<Order[]> {
  let collection = db.orders.orderBy('createdAt').reverse();
  let rows = await collection.toArray();
  if (opts?.industryId) {
    rows = rows.filter((o) => o.industryId === opts.industryId);
  }
  if (opts?.limit) {
    rows = rows.slice(0, opts.limit);
  }
  return rows;
}

/**
 * PRD §3.4 AC-006: 訂單歷史搜尋（日期/金額/付款方式）。
 * Returns orders matching the query (search by paymentMethod or amount).
 */
export async function searchOrders(query: string, industryId?: IndustryId): Promise<Order[]> {
  const lower = query.trim().toLowerCase();
  const rows = await db.orders.orderBy('createdAt').reverse().toArray();
  const filtered = industryId ? rows.filter((o) => o.industryId === industryId) : rows;
  if (!lower) return filtered;

  // Try to parse as number for amount search
  const asNumber = Number(lower);
  const isAmountSearch = !Number.isNaN(asNumber) && lower.length > 0;

  return filtered.filter((o) => {
    if (o.paymentMethod.toLowerCase().includes(lower)) return true;
    if (o.orderNumber.toLowerCase().includes(lower)) return true;
    if (o.technician?.toLowerCase().includes(lower)) return true;
    if (isAmountSearch && o.totalAmount === asNumber) return true;
    return false;
  });
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (input.items.length === 0) {
    throw new Error('ORDER_001: 購物車為空');
  }
  if (!input.paymentMethod) {
    throw new Error('ORDER_002: 付款方式未選');
  }

  const orderId = uid();
  const items: OrderItem[] = input.items.map((it) => {
    const subtotal = computeLineSubtotal(it.product, it.quantity);
    const commission = computeLineCommission({
      productName: it.product.name,
      product: { commissionRate: it.product.commissionRate },
      quantity: it.quantity,
      unitPrice: it.product.price,
      subtotal,
    });
    return {
      id: uid(),
      orderId,
      productId: it.product.id,
      productName: it.product.name,
      quantity: it.quantity,
      unitPrice: it.product.price,
      subtotal,
      commissionAmount: commission,
    };
  });

  const totalAmount = items.reduce((s, it) => s + it.subtotal, 0);

  // Sequence: count today's orders + 1
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayCount = await db.orders.where('createdAt').aboveOrEqual(todayStart).count();

  const order: Order = {
    id: orderId,
    orderNumber: formatOrderNumber(now, todayCount + 1),
    industryId: input.industryId,
    items,
    totalAmount,
    paymentMethod: input.paymentMethod,
    customerNote: input.customerNote ?? null,
    technician: input.technician ?? null,
    createdAt: Date.now(),
  };

  await db.orders.put(order);
  return order;
}

export async function deleteOrder(id: string): Promise<void> {
  await db.orders.delete(id);
}

/**
 * PRD §3.4 AC-005: 切換行業時原訂單保留（標記為「餐飲歷史」）。
 * Orders retain their industryId, so they remain visible under historical filter.
 * This is implicit — Order.industryId never changes.
 */
