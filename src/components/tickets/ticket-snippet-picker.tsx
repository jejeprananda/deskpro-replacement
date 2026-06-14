"use client";

import { useState } from "react";
import { useTopLevelSnippets } from "@/hooks/useTopLevelSnippets";
import {
  parseSnippetContent,
  type SnippetVariables,
} from "@/lib/snippet-content";
import type { SnippetItem } from "@/types/top-level-snippets";

interface TicketSnippetPickerProps {
  snippetContext: SnippetVariables;
  onSelect: (plainText: string) => void;
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
}: TicketSnippetPickerProps) {
  const [selectedId, setSelectedId] = useState("");
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

  return (
    <div className="space-y-1">
      <label
        htmlFor="ticket-snippet-picker"
        className="block text-xs font-medium text-zinc-700"
      >
        Snippet
      </label>
      <select
        id="ticket-snippet-picker"
        value={selectedId}
        onChange={handleChange}
        disabled={snippetsQuery.isLoading || snippetsQuery.isError}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 sm:max-w-md"
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
        <p className="text-xs text-red-600">Gagal memuat snippet.</p>
      ) : null}
    </div>
  );
}
