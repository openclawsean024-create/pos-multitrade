// Zustand store for active industry + UI state
//
// Snapshot-before-switch orchestration: industry switching persists the
// current snapshot into the IndexedDB `meta` store BEFORE mutating the active
// industry, then re-seeds the target industry and clears the cart. If the
// snapshot write fails, the active industry is not changed.

import { create } from 'zustand';
import type { IndustryId } from '@/types/industry';
import { INDUSTRIES } from '@/types/industry';
import { buildSnapshot, serializeSnapshot } from '@/db/snapshotRepo';
import { ensureIndustrySeeded } from '@/db/productRepo';
import { META_KEYS, getMeta, setMeta } from '@/db/dexie';
import { useCartStore } from '@/store/cartStore';

export const META_SNAPSHOT_KEY = 'latestSnapshot' as const;
export const META_SNAPSHOT_AT_KEY = 'latestSnapshotAt' as const;
export const META_SNAPSHOT_INDUSTRY_KEY = 'latestSnapshotIndustry' as const;

export type IndustrySwitchResult =
  | { ok: true; previousIndustry: IndustryId; snapshotAt: number }
  | { ok: false; error: string };

interface AppState {
  activeIndustry: IndustryId;
  setActiveIndustry: (id: IndustryId) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  switchIndustry: (target: IndustryId) => Promise<IndustrySwitchResult>;
  hydrateActiveIndustry: () => Promise<IndustryId>;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeIndustry: 'fnb',
  setActiveIndustry: (id) => set({ activeIndustry: id }),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setIsOnline: (online) => set({ isOnline: online }),

  hydrateActiveIndustry: async () => {
    try {
      const stored = await getMeta<IndustryId>(META_KEYS.ACTIVE_INDUSTRY);
      const id: IndustryId = stored && stored in INDUSTRIES ? stored : 'fnb';
      set({ activeIndustry: id });
      return id;
    } catch {
      return get().activeIndustry;
    }
  },

  switchIndustry: async (target) => {
    const previous = get().activeIndustry;
    if (previous === target) {
      return { ok: true, previousIndustry: previous, snapshotAt: Date.now() };
    }

    // 1. Build + persist current snapshot BEFORE mutating active industry
    let snapshotAt: number;
    try {
      const snap = await buildSnapshot(previous);
      const json = serializeSnapshot(snap);
      snapshotAt = Date.now();
      await setMeta(META_SNAPSHOT_KEY as never, json);
      await setMeta(META_SNAPSHOT_AT_KEY as never, snapshotAt);
      await setMeta(META_SNAPSHOT_INDUSTRY_KEY as never, previous);
    } catch (err) {
      // Snapshot write failed: do NOT change active industry
      return {
        ok: false,
        error: `snapshot_failed: ${(err as Error).message ?? String(err)}`,
      };
    }

    // 2. Seed target industry products (idempotent)
    try {
      await ensureIndustrySeeded(target);
    } catch {
      // Seeding failure is non-fatal; user will see empty catalogue state.
    }

    // 3. Persist new active industry + clear cart (cross-profile isolation)
    try {
      await setMeta(META_KEYS.ACTIVE_INDUSTRY, target);
    } catch {
      // If meta write fails, still apply in-memory so the UI is usable.
    }
    set({ activeIndustry: target });
    useCartStore.getState().clear();

    return { ok: true, previousIndustry: previous, snapshotAt };
  },
}));
