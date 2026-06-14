"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SnippetIcon } from "@/components/ui/attachment-icons";
import { useTopLevelSnippets } from "@/hooks/useTopLevelSnippets";
import {
  parseSnippetContent,
  type SnippetVariables,
} from "@/lib/snippet-content";
import type { SnippetItem } from "@/types/top-level-snippets";

interface TicketSnippetPickerProps {
  snippetContext: SnippetVariables;
  onSelect: (plainText: string) => void;
  variant?: "select" | "icon";
  buttonClassName?: string;
}

function formatDeskproSnippetLabel(snippet: SnippetItem): string {
  if (snippet.shortCode) {
    return `${snippet.title} (${snippet.shortCode})`;
  }

  return snippet.title;
}

export function TicketSnippetPicker({
  snippetContext,
  onSelect,
  variant = "icon",
  buttonClassName = "",
}: TicketSnippetPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const deskproQuery = useTopLevelSnippets();

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closePopover();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePopover();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePopover, isOpen]);

  const handleDeskproSelect = useCallback(
    (snippet: SnippetItem) => {
      const plainText = parseSnippetContent(snippet.contentRaw, snippetContext);
      onSelect(plainText);
      closePopover();
    },
    [closePopover, onSelect, snippetContext],
  );

  if (variant === "select") {
    return (
      <div className="space-y-1">
        <label
          htmlFor="ticket-snippet-picker"
          className="block text-xs font-medium text-foreground"
        >
          Snippet
        </label>
        <select
          id="ticket-snippet-picker"
          defaultValue=""
          onChange={(event) => {
            const snippetId = event.target.value;
            if (!snippetId) {
              return;
            }

            const snippet = deskproQuery.data?.snippets.find(
              (item) => item.id === snippetId,
            );

            if (!snippet) {
              return;
            }

            handleDeskproSelect(snippet);
            event.target.value = "";
          }}
          disabled={deskproQuery.isLoading || deskproQuery.isError}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted sm:max-w-md"
        >
          <option value="">
            {deskproQuery.isLoading ? "Memuat snippet..." : "Pilih template..."}
          </option>
          {deskproQuery.data?.snippets.map((snippet) => (
            <option key={snippet.id} value={snippet.id}>
              {formatDeskproSnippetLabel(snippet)}
            </option>
          ))}
        </select>
        {deskproQuery.isError ? (
          <p className="text-xs text-red-600">Gagal memuat snippet.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        title="Insert Deskpro snippet"
        aria-label="Insert Deskpro snippet"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${buttonClassName}`}
      >
        <SnippetIcon />
        Snippet
      </button>

      {isOpen ? (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-72 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="max-h-72 overflow-y-auto p-2">
            <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Deskpro
            </p>
            {deskproQuery.isLoading ? (
              <p className="px-1 py-2 text-xs text-muted">Memuat snippet...</p>
            ) : null}
            {deskproQuery.isError ? (
              <p className="px-1 py-2 text-xs text-red-600">
                Gagal memuat snippet Deskpro.
              </p>
            ) : null}
            {!deskproQuery.isLoading &&
            !deskproQuery.isError &&
            (deskproQuery.data?.snippets.length ?? 0) === 0 ? (
              <p className="px-1 py-2 text-xs text-muted">
                Tidak ada snippet Deskpro.
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {deskproQuery.data?.snippets.map((snippet) => (
                <li key={snippet.id}>
                  <button
                    type="button"
                    onClick={() => handleDeskproSelect(snippet)}
                    className="w-full rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-surface-muted"
                  >
                    {formatDeskproSnippetLabel(snippet)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
