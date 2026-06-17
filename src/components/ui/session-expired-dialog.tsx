"use client";

import { usePathname } from "next/navigation";
import { useSessionExpiredStore } from "@/stores/session-expired.store";

export function SessionExpiredDialog() {
  const pathname = usePathname();
  const open = useSessionExpiredStore((state) => state.open);

  if (!open || pathname === "/login") {
    return null;
  }

  function handleRelogin() {
    window.location.href = "/login";
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-dialog-title"
      aria-describedby="session-expired-dialog-description"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl">
        <h2
          id="session-expired-dialog-title"
          className="text-base font-semibold text-foreground"
        >
          Sesi berakhir
        </h2>
        <p
          id="session-expired-dialog-description"
          className="mt-2 text-sm text-muted"
        >
          Login Anda sudah tidak valid atau sesi telah habis. Silakan masuk
          kembali untuk melanjutkan.
        </p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleRelogin}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Login ulang
          </button>
        </div>
      </div>
    </div>
  );
}
