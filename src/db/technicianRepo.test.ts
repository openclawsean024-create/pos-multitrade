// Technician repo tests

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, deleteAllData } from '@/db/dexie';
import { createTechnician, listTechnicians } from '@/db/technicianRepo';

describe('technicianRepo', () => {
  beforeEach(async () => {
    await deleteAllData();
  });
  afterEach(async () => {
    await deleteAllData();
  });

  it('createTechnician 新增技師', async () => {
    const t = await createTechnician({
      name: '小華',
      industryId: 'service',
      defaultCommissionRate: 0.4,
    });
    expect(t.id).toBeTruthy();
    expect(t.totalEarnings).toBe(0);
  });

  it('TECHNICIAN_002: 同名重複拋錯', async () => {
    await createTechnician({
      name: '小華',
      industryId: 'service',
      defaultCommissionRate: 0.4,
    });
    await expect(
      createTechnician({
        name: '小華',
        industryId: 'service',
        defaultCommissionRate: 0.5,
      }),
    ).rejects.toThrow(/TECHNICIAN_002/);
  });

  it('listTechnicians 回傳全部', async () => {
    await createTechnician({ name: 'A', industryId: 'service', defaultCommissionRate: 0.4 });
    await createTechnician({ name: 'B', industryId: 'service', defaultCommissionRate: 0.4 });
    const all = await listTechnicians();
    expect(all.length).toBe(2);
  });
});
