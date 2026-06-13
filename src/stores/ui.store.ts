import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  ticketFiltersOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTicketFiltersOpen: () => void;
  setTicketFiltersOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  ticketFiltersOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleTicketFiltersOpen: () =>
    set((state) => ({ ticketFiltersOpen: !state.ticketFiltersOpen })),
  setTicketFiltersOpen: (open) => set({ ticketFiltersOpen: open }),
}));
