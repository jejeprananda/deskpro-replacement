"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { APP_NAME } from "@/lib/app-config";
import { useUiStore } from "@/stores/ui.store";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tickets", label: "Tickets" },
  { href: "/profile", label: "Profile" },
  { href: "/settings", label: "Settings" },
];

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  sidebarExtra?: React.ReactNode;
}

export function AppShell({ children, title, sidebarExtra }: AppShellProps) {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <div className="flex min-h-full flex-1 bg-zinc-50">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } flex flex-col border-r border-zinc-200 bg-white transition-all`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          {sidebarOpen ? (
            <span className="text-sm font-semibold text-zinc-900">{APP_NAME}</span>
          ) : (
            <span className="text-xs font-semibold text-zinc-900">JT</span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "<<" : ">>"}
          </button>
        </div>
        <nav
          className={`flex flex-col gap-1 p-2 ${sidebarExtra ? "" : "flex-1"}`}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {sidebarOpen ? item.label : item.label.charAt(0)}
              </Link>
            );
          })}
        </nav>
        {sidebarExtra ? (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-zinc-200">
            {sidebarExtra}
          </div>
        ) : null}
        <div className="border-t border-zinc-200 p-4">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white px-6 py-4">
          <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
