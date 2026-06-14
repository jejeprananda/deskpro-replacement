"use client";

import { Brain } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PersonalSnippetFormDialog } from "@/components/tickets/personal-snippet-form-dialog";
import { usePersonalSnippets } from "@/hooks/usePersonalSnippets";
import {
  applySnippetVariables,
  type SnippetVariables,
} from "@/lib/snippet-content";
import type { PersonalSnippet } from "@/types/personal-snippet";

interface TicketPersonalSnippetPickerProps {
  snippetContext: SnippetVariables;
  onSelect: (plainText: string) => void;
  buttonClassName?: string;
}

type DialogState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; snippet: PersonalSnippet };

function getMutationErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return "Gagal menyimpan snippet.";
}

export function TicketPersonalSnippetPicker({
  snippetContext,
  onSelect,
  buttonClassName = "",
}: TicketPersonalSnippetPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>({ open: false });
  const [dialogError, setDialogError] = useState<string | null>(null);

  const {
    query: personalQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  } = usePersonalSnippets();

  const closePopover = useCallback(() => {
    setIsOpen(false);
  }, []);

  const closeDialog = useCallback(() => {
    if (
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending
    ) {
      return;
    }

    setDialogState({ open: false });
    setDialogError(null);
  }, [
    createMutation.isPending,
    deleteMutation.isPending,
    updateMutation.isPending,
  ]);

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

  const handlePersonalSelect = useCallback(
    (snippet: PersonalSnippet) => {
      const plainText = applySnippetVariables(snippet.body, snippetContext);
      onSelect(plainText);
      closePopover();
    },
    [closePopover, onSelect, snippetContext],
  );

  const handleDeletePersonal = useCallback(
    async (snippet: PersonalSnippet) => {
      const confirmed = window.confirm(
        `Hapus snippet "${snippet.title}"? Tindakan ini tidak bisa dibatalkan.`,
      );

      if (!confirmed) {
        return;
      }

      try {
        await deleteMutation.mutateAsync(snippet.id);
      } catch {
        window.alert("Gagal menghapus snippet.");
      }
    },
    [deleteMutation],
  );

  const handleDialogSubmit = useCallback(
    async (values: { title: string; body: string }) => {
      setDialogError(null);

      try {
        if (dialogState.open && dialogState.mode === "edit") {
          await updateMutation.mutateAsync({
            id: dialogState.snippet.id,
            input: values,
          });
        } else {
          await createMutation.mutateAsync(values);
        }

        closeDialog();
      } catch (error) {
        setDialogError(getMutationErrorMessage(error));
      }
    },
    [closeDialog, createMutation, dialogState, updateMutation],
  );

  const isDialogSubmitting =
    createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div ref={rootRef} className="relative inline-flex">
        <button
          type="button"
          title="Insert my snippet"
          aria-label="Insert my snippet"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${buttonClassName}`}
        >
          <Brain className="h-4 w-4 shrink-0" aria-hidden="true" />
          My Snippet
        </button>

        {isOpen ? (
          <div className="absolute bottom-full left-0 z-20 mb-1 w-72 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            <div className="max-h-72 overflow-y-auto p-2">
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                My Snippets
              </p>
              {personalQuery.isLoading ? (
                <p className="px-1 py-2 text-xs text-muted">Memuat snippet...</p>
              ) : null}
              {personalQuery.isError ? (
                <p className="px-1 py-2 text-xs text-red-600">
                  Gagal memuat snippet pribadi.
                </p>
              ) : null}
              {!personalQuery.isLoading &&
              !personalQuery.isError &&
              (personalQuery.data?.snippets.length ?? 0) === 0 ? (
                <p className="px-1 py-2 text-xs text-muted">
                  Belum ada snippet pribadi.
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {personalQuery.data?.snippets.map((snippet) => (
                  <li
                    key={snippet.id}
                    className="flex items-center gap-1 rounded-md hover:bg-surface-muted"
                  >
                    <button
                      type="button"
                      onClick={() => handlePersonalSelect(snippet)}
                      className="min-w-0 flex-1 px-2 py-1.5 text-left text-xs text-foreground"
                    >
                      <span className="block truncate">{snippet.title}</span>
                    </button>
                    <button
                      type="button"
                      title={`Edit ${snippet.title}`}
                      aria-label={`Edit ${snippet.title}`}
                      onClick={() => {
                        setDialogError(null);
                        setDialogState({ open: true, mode: "edit", snippet });
                      }}
                      className="rounded px-1.5 py-1 text-xs text-muted hover:bg-surface hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      title={`Delete ${snippet.title}`}
                      aria-label={`Delete ${snippet.title}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => void handleDeletePersonal(snippet)}
                      className="rounded px-1.5 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40"
                    >
                      Del
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setDialogError(null);
                  setDialogState({ open: true, mode: "create" });
                }}
                className="mt-2 w-full rounded-md border border-dashed border-border px-2 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
              >
                + Tambah snippet
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <PersonalSnippetFormDialog
        open={dialogState.open}
        mode={dialogState.open && dialogState.mode === "edit" ? "edit" : "create"}
        initialValues={
          dialogState.open && dialogState.mode === "edit"
            ? {
                title: dialogState.snippet.title,
                body: dialogState.snippet.body,
              }
            : undefined
        }
        isSubmitting={isDialogSubmitting}
        errorMessage={dialogError}
        onClose={closeDialog}
        onSubmit={(values) => void handleDialogSubmit(values)}
      />
    </>
  );
}
