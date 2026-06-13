"use client";

import { useToastStore } from "@/stores/toast.store";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.variant === "success";

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              isSuccess
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className={`shrink-0 rounded px-1 text-xs font-medium ${
                isSuccess
                  ? "text-emerald-700 hover:text-emerald-900"
                  : "text-red-700 hover:text-red-900"
              }`}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
