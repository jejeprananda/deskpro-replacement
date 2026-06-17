import { create } from "zustand";

interface SessionExpiredState {
  open: boolean;
  openSessionExpired: () => void;
  closeSessionExpired: () => void;
}

export const useSessionExpiredStore = create<SessionExpiredState>((set) => ({
  open: false,
  openSessionExpired: () => {
    set({ open: true });
  },
  closeSessionExpired: () => {
    set({ open: false });
  },
}));
