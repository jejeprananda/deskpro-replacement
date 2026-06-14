"use client";

import Image from "next/image";
import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function SidebarUserProfile() {
  const userQuery = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = userQuery.data?.user;
  const displayName = user?.displayName || user?.name || "Agent";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="relative border-t border-zinc-200 p-3">
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-zinc-50"
      >
        {user?.avatar ? (
          <Image
            src={user.avatar}
            alt={displayName}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900">
            {displayName}
          </p>
          <p className="truncate text-xs text-zinc-500">Agent</p>
        </div>

        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
      </button>

      {menuOpen ? (
        <div className="absolute bottom-full left-3 right-3 mb-1 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
