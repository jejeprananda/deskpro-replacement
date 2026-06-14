"use client";

import { useRef, useState } from "react";
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

function formatSnippetLabel(snippet: SnippetItem): string {
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
  const [selectedId, setSelectedId] = useState("");
  const selectRef = useRef<HTMLSelectElement>(null);
  const snippetsQuery = useTopLevelSnippets();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const snippetId = event.target.value;
    if (!snippetId) {
      return;
    }

    const snippet = snippetsQuery.data?.snippets.find(
      (item) => item.id === snippetId,
    );

    if (!snippet) {
      setSelectedId("");
      return;
    }

    const plainText = parseSnippetContent(snippet.contentRaw, snippetContext);
    onSelect(plainText);
    setSelectedId("");
  };

  const selectElement = (
    <select
      ref={selectRef}
      id="ticket-snippet-picker"
      value={selectedId}
      onChange={handleChange}
      disabled={snippetsQuery.isLoading || snippetsQuery.isError}
      className={
        variant === "icon"
          ? "sr-only"
          : "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted sm:max-w-md"
      }
      tabIndex={variant === "icon" ? -1 : undefined}
    >
      <option value="">
        {snippetsQuery.isLoading ? "Memuat snippet..." : "Pilih template..."}
      </option>
      {snippetsQuery.data?.snippets.map((snippet) => (
        <option key={snippet.id} value={snippet.id}>
          {formatSnippetLabel(snippet)}
        </option>
      ))}
    </select>
  );

  if (variant === "icon") {
    return (
      <div className="relative inline-flex">
        <span
          className={`pointer-events-none inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium ${buttonClassName}`}
          aria-hidden="true"
        >
          <SnippetIcon />
          Snippet
        </span>
        <select
          ref={selectRef}
          id="ticket-snippet-picker"
          value={selectedId}
          onChange={handleChange}
          disabled={snippetsQuery.isLoading || snippetsQuery.isError}
          title="Insert snippet"
          aria-label="Insert snippet"
          className={`absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed ${buttonClassName}`}
        >
          <option value="">
            {snippetsQuery.isLoading
              ? "Memuat snippet..."
              : "Pilih template..."}
          </option>
          {snippetsQuery.data?.snippets.map((snippet) => (
            <option key={snippet.id} value={snippet.id}>
              {formatSnippetLabel(snippet)}
            </option>
          ))}
        </select>
        {snippetsQuery.isError ? (
          <span className="sr-only">Gagal memuat snippet.</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label
        htmlFor="ticket-snippet-picker"
        className="block text-xs font-medium text-foreground"
      >
        Snippet
      </label>
      {selectElement}
      {snippetsQuery.isError ? (
        <p className="text-xs text-red-600">Gagal memuat snippet.</p>
      ) : null}
    </div>
  );
}
