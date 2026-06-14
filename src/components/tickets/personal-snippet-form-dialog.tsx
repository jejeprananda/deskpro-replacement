"use client";

import { useEffect, useState } from "react";
import type { PersonalSnippet } from "@/types/personal-snippet";

interface PersonalSnippetFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: Pick<PersonalSnippet, "title" | "body">;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: { title: string; body: string }) => void;
}

interface FormBodyProps {
  mode: "create" | "edit";
  initialValues?: Pick<PersonalSnippet, "title" | "body">;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (values: { title: string; body: string }) => void;
}

function FormBody({
  mode,
  initialValues,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: FormBodyProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [body, setBody] = useState(initialValues?.body ?? "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle || !trimmedBody || isSubmitting) {
      return;
    }

    onSubmit({ title: trimmedTitle, body: trimmedBody });
  };

  return (
    <form
      className="w-full max-w-lg rounded-xl border border-border bg-surface p-4 shadow-xl"
      onClick={(event) => event.stopPropagation()}
      onSubmit={handleSubmit}
    >
      <h2
        id="personal-snippet-dialog-title"
        className="text-sm font-semibold text-foreground"
      >
        {mode === "create" ? "Tambah snippet" : "Edit snippet"}
      </h2>
      <p className="mt-1 text-xs text-muted">
        Variabel: {"{{ ticket.user.name }}"}, {"{{ ticket.subject }}"}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="personal-snippet-title"
            className="mb-1 block text-xs font-medium text-foreground"
          >
            Judul
          </label>
          <input
            id="personal-snippet-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            disabled={isSubmitting}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-surface-muted"
            placeholder="Contoh: Balasan menunggu konfirmasi"
          />
        </div>

        <div>
          <label
            htmlFor="personal-snippet-body"
            className="mb-1 block text-xs font-medium text-foreground"
          >
            Isi snippet
          </label>
          <textarea
            id="personal-snippet-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={20_000}
            rows={8}
            disabled={isSubmitting}
            className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-surface-muted"
            placeholder="Tulis template balasan..."
          />
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-xs text-red-600">{errorMessage}</p>
      ) : null}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !body.trim()}
          className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted"
        >
          {isSubmitting ? "Menyimpan..." : mode === "create" ? "Simpan" : "Perbarui"}
        </button>
      </div>
    </form>
  );
}

export function PersonalSnippetFormDialog({
  open,
  mode,
  initialValues,
  isSubmitting = false,
  errorMessage = null,
  onClose,
  onSubmit,
}: PersonalSnippetFormDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  const formKey =
    mode === "edit"
      ? `edit-${initialValues?.title ?? ""}-${initialValues?.body ?? ""}`
      : "create";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="personal-snippet-dialog-title"
      onClick={() => {
        if (!isSubmitting) {
          onClose();
        }
      }}
    >
      <FormBody
        key={formKey}
        mode={mode}
        initialValues={initialValues}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </div>
  );
}
