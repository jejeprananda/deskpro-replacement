import { create } from "zustand";

export type ToastVariant = "success" | "error";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, variant: ToastVariant) => void;
  dismissToast: (id: string) => void;
}

const AUTO_DISMISS_MS = 4000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  showToast: (message, variant) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant }],
    }));

    window.setTimeout(() => {
      get().dismissToast(id);
    }, AUTO_DISMISS_MS);
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
