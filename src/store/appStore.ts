// Zustand store for active industry + UI state

import { create } from 'zustand';
import type { IndustryId } from '@/types/industry';

interface AppState {
  activeIndustry: IndustryId;
  setActiveIndustry: (id: IndustryId) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeIndustry: 'fnb',
  setActiveIndustry: (id) => set({ activeIndustry: id }),
  isOnline: true,
  setIsOnline: (online) => set({ isOnline: online }),
}));
