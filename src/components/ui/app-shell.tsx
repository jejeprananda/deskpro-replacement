"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Ticket,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { PageTopBar } from "@/components/ui/page-top-bar";
import { SidebarUserProfile } from "@/components/ui/sidebar-user-profile";
import { useUiStore } from "@/stores/ui.store";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface AppShellProps {
  children: React.ReactNode;
  sidebarExtra?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function AppShell({
  children,
  sidebarExtra,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: AppShellProps) {
  const pathname = usePathname();
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } flex h-full shrink-0 flex-col border-r border-border bg-surface transition-all`}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <BrandLogo compact={!sidebarOpen} />
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-muted"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "<<" : ">>"}
          </button>
        </div>

        <nav
          className={`flex flex-col gap-1 p-2 ${sidebarExtra ? "" : "flex-1"}`}
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "text-foreground hover:bg-surface-muted"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {sidebarOpen ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        {sidebarExtra ? (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border">
            {sidebarExtra}
          </div>
        ) : null}

        {sidebarOpen ? <SidebarUserProfile /> : null}
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PageTopBar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
        />
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
