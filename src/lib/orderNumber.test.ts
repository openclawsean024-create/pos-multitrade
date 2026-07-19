// Order number formatting

import { describe, it, expect } from 'vitest';
import { filterOrdersByMonth, formatOrderNumber, yearMonthKey } from '@/lib/orderNumber';

describe('orderNumber', () => {
  it('formatOrderNumber 2026-07-19 sequence 1 = ORD-20260719-001', () => {
    expect(formatOrderNumber(new Date('2026-07-19T10:00:00Z'), 1)).toBe('ORD-20260719-001');
  });

  it('formatOrderNumber sequence 42 zero-pads to 3 digits', () => {
    expect(formatOrderNumber(new Date('2026-07-19'), 42)).toBe('ORD-20260719-042');
  });

  it('formatOrderNumber sequence 1234 = 1234 (no truncation)', () => {
    expect(formatOrderNumber(new Date('2026-07-19'), 1234)).toBe('ORD-20260719-1234');
  });

  it('yearMonthKey 2026-07', () => {
    expect(yearMonthKey(new Date('2026-07-19'))).toBe('2026-07');
  });

  it('yearMonthKey December 2026-12', () => {
    expect(yearMonthKey(new Date('2026-12-31'))).toBe('2026-12');
  });

  it('filterOrdersByMonth 只回傳該月訂單', () => {
    const orders = [
      { createdAt: new Date('2026-07-19').getTime() },
      { createdAt: new Date('2026-07-20').getTime() },
      { createdAt: new Date('2026-08-01').getTime() },
    ];
    const filtered = filterOrdersByMonth(orders, '2026-07');
    expect(filtered).toHaveLength(2);
  });
});
