// Technician repository — PRD §4.3 Technician

import { db } from '@/db/dexie';
import type { Technician } from '@/types';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listTechnicians(): Promise<Technician[]> {
  return db.technicians.orderBy('name').toArray();
}

export async function getTechnician(id: string): Promise<Technician | undefined> {
  return db.technicians.get(id);
}

export async function createTechnician(input: Omit<Technician, 'id' | 'createdAt' | 'totalEarnings'>): Promise<Technician> {
  const existing = await db.technicians.where('name').equals(input.name).first();
  if (existing) {
    throw new Error('TECHNICIAN_002: 技師姓名重複');
  }
  const tech: Technician = {
    id: uid(),
    name: input.name,
    industryId: input.industryId,
    defaultCommissionRate: input.defaultCommissionRate,
    totalEarnings: 0,
    createdAt: Date.now(),
  };
  await db.technicians.put(tech);
  return tech;
}

export async function deleteTechnician(id: string): Promise<void> {
  await db.technicians.delete(id);
}
