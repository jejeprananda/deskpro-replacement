"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
};

interface SearchableSelectProps {
  id?: string;
  value: string | null;
  placeholder?: string;
  options: SearchableSelectOption[];
  onChange: (value: string | null, option: SearchableSelectOption | null) => void;
  disabled?: boolean;
  footer?: React.ReactNode;
  renderValue?: (option: SearchableSelectOption | null) => React.ReactNode;
  renderOption?: (option: SearchableSelectOption) => React.ReactNode;
  variant?: "default" | "pending" | "selected";
}

export function SearchableSelect({
  id,
  value,
  placeholder = "Select value",
  options,
  onChange,
  disabled = false,
  footer,
  renderValue,
  renderOption,
  variant = "default",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    options.find((option) => option.value === value) ?? null;

  const filteredOptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) => {
      const haystack = `${option.label} ${option.keywords ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [options, search]);

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
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const triggerClassName =
    variant === "selected"
      ? "border-blue-300 bg-blue-50/80 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-100"
      : variant === "pending"
        ? "border-amber-300 bg-amber-50/70 text-amber-900 hover:border-amber-400 focus:border-amber-500 focus:ring-amber-100"
        : "border-zinc-200 bg-white hover:border-zinc-300 focus:border-blue-500 focus:ring-blue-100";

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 ${triggerClassName}`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-zinc-900" : variant === "pending" ? "text-amber-700" : "text-zinc-500"
          }`}
        >
          {selectedOption
            ? renderValue
              ? renderValue(selectedOption)
              : selectedOption.label
            : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-zinc-400" />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div className="border-b border-zinc-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="w-full rounded-md border border-zinc-200 py-1.5 pl-8 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 hover:text-zinc-600"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500">No results.</li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.value, option);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-blue-50 text-blue-700"
                          : "text-zinc-700 hover:bg-zinc-50"
                      }`}
                    >
                      {renderOption ? renderOption(option) : option.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {footer ? (
            <div className="border-t border-zinc-100 p-2">{footer}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
