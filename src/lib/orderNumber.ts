// Order number generator (PRD §4.3 Order.orderNumber)

/**
 * Format: ORD-YYYYMMDD-NNN (zero-padded sequence per day).
 * Pure function — caller provides the sequence.
 */
export function formatOrderNumber(date: Date, sequence: number): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(3, '0');
  return `ORD-${yyyy}${mm}${dd}-${seq}`;
}

/**
 * Get year-month key (e.g. "2026-07") for a Date.
 */
export function yearMonthKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

/**
 * Filter orders to those within the given year-month (inclusive).
 */
export function filterOrdersByMonth<T extends { createdAt: number }>(
  orders: T[],
  ym: string,
): T[] {
  return orders.filter((o) => yearMonthKey(new Date(o.createdAt)) === ym);
}
