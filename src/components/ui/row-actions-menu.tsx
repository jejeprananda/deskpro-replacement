"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface RowActionsMenuProps {
  href: string;
}

export function RowActionsMenu({ href }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
        aria-label="Row actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div className="absolute right-0 z-10 mt-1 min-w-36 rounded-lg border border-border bg-surface py-1 shadow-lg">
          <Link
            href={href}
            className="block px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
            onClick={() => setOpen(false)}
          >
            View ticket
          </Link>
        </div>
      ) : null}
    </div>
  );
}
