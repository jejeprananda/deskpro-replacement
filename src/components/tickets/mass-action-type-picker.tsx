"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  MASS_ACTION_OPTIONS,
  type MassActionType,
} from "@/types/mass-action";

interface MassActionTypePickerProps {
  usedTypes: MassActionType[];
  onSelect: (type: MassActionType) => void;
}

export function MassActionTypePicker({
  usedTypes,
  onSelect,
}: MassActionTypePickerProps) {
  const [search, setSearch] = useState("");

  const availableOptions = useMemo(
    () =>
      MASS_ACTION_OPTIONS.filter((option) => !usedTypes.includes(option.type)),
    [usedTypes],
  );

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return availableOptions;
    }

    return availableOptions.filter((option) =>
      option.label.toLowerCase().includes(normalizedSearch),
    );
  }, [availableOptions, search]);

  if (availableOptions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-semibold text-zinc-500">
          +
        </span>
        <div>
          <span className="block text-sm font-medium text-zinc-700">
            Add action
          </span>
          <span className="text-xs text-zinc-500">Choose another mass action</span>
        </div>
      </div>

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search actions..."
          className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <ul className="overflow-hidden rounded-lg border border-zinc-200">
        {filteredOptions.length === 0 ? (
          <li className="px-3 py-2 text-sm text-zinc-500">No actions found.</li>
        ) : (
          filteredOptions.map((option) => (
            <li key={option.type}>
              <button
                type="button"
                onClick={() => onSelect(option.type)}
                className="w-full px-3 py-2.5 text-left text-sm text-zinc-800 hover:bg-blue-50 hover:text-blue-700"
              >
                {option.label}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
