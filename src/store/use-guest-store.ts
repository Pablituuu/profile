import { create } from 'zustand';

interface GuestState {
  isGuest: boolean;
  setIsGuest: (value: boolean) => void;
}

export const useGuestStore = create<GuestState>((set) => ({
  isGuest: false,
  setIsGuest: (isGuest) => set({ isGuest }),
}));
