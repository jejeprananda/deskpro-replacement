"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { TicketSnippetPicker } from "@/components/tickets/ticket-snippet-picker";
import { useSubmitTicketReply } from "@/hooks/useSubmitTicketReply";
import type { SnippetVariables } from "@/lib/snippet-content";
import { useToastStore } from "@/stores/toast.store";
import type { ReplyMessageType, ReplyStatusId } from "@/types/ticket-reply";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
]);
const ACCEPTED_IMAGE_EXTENSIONS = new Set([".png", ".jpeg", ".jpg"]);
const ACCEPTED_FILE_EXTENSIONS = new Set([
  ".png",
  ".jpeg",
  ".jpg",
  ".pdf",
  ".doc",
  ".docx",
]);

const REPLY_STATUS_OPTIONS: Array<{
  value: ReplyStatusId;
  label: string;
  description: string;
}> = [
  {
    value: "awaiting_agent",
    label: "Awaiting Agent",
    description: "Kewajiban follow-up masih di agent.",
  },
  {
    value: "awaiting_user",
    label: "Awaiting User",
    description: "Menunggu konfirmasi user; auto-solved jika 3 hari tanpa jawaban.",
  },
];

const MESSAGE_TYPE_TABS: Array<{
  value: ReplyMessageType;
  label: string;
  description: string;
}> = [
  {
    value: "email",
    label: "Email",
    description: "Balasan yang dapat dibaca user.",
  },
  {
    value: "note",
    label: "Note",
    description: "Catatan internal — hanya terlihat oleh agent.",
  },
];

type PendingAttachment = {
  id: string;
  file: File;
  previewUrl: string | null;
  isInline: boolean;
};

interface TicketReplyComposerProps {
  ticketId: string;
  ownerId?: string | null;
  listHref: string;
  snippetContext: SnippetVariables;
}

function isAcceptedFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return [...ACCEPTED_FILE_EXTENSIONS].some((extension) =>
    lowerName.endsWith(extension),
  );
}

function isInlineImage(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return [...ACCEPTED_IMAGE_EXTENSIONS].some((extension) =>
    lowerName.endsWith(extension),
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} kB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return "Gagal mengirim. Coba lagi.";
}

export function TicketReplyComposer({
  ticketId,
  ownerId = null,
  listHref,
  snippetContext,
}: TicketReplyComposerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [messageType, setMessageType] = useState<ReplyMessageType>("email");
  const [replyText, setReplyText] = useState("");
  const [statusId, setStatusId] = useState<ReplyStatusId>("awaiting_agent");
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const submitReply = useSubmitTicketReply();

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  const clearPendingAttachments = useCallback(() => {
    for (const attachment of pendingAttachmentsRef.current) {
      if (attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    }
    setPendingAttachments([]);
  }, []);

  const addAttachments = useCallback((files: FileList | File[]) => {
    const nextAttachments: PendingAttachment[] = [];

    for (const file of files) {
      if (!isAcceptedFile(file)) {
        continue;
      }

      nextAttachments.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        previewUrl: isInlineImage(file) ? URL.createObjectURL(file) : null,
        isInline: isInlineImage(file),
      });
    }

    if (nextAttachments.length === 0) {
      return;
    }

    setPendingAttachments((current) => [...current, ...nextAttachments]);
  }, []);

  useEffect(() => {
    return () => {
      for (const attachment of pendingAttachmentsRef.current) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
    };
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = event.clipboardData?.files;
      if (items && items.length > 0) {
        event.preventDefault();
        addAttachments(items);
      }
    },
    [addAttachments],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.dataTransfer.files.length > 0) {
        addAttachments(event.dataTransfer.files);
      }
    },
    [addAttachments],
  );

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return current.filter((attachment) => attachment.id !== id);
    });
  }, []);

  const handleSnippetSelect = useCallback((plainText: string) => {
    setReplyText((current) => {
      const separator = current.trim() ? "\n\n" : "";
      return current + separator + plainText;
    });
  }, []);

  const handleSend = useCallback(async () => {
    const message = replyText.trim();
    if (!message || submitReply.isPending) {
      return;
    }

    try {
      await submitReply.mutateAsync({
        ticketId,
        ownerId,
        message,
        statusId,
        messageType,
        attachments: pendingAttachments.map((attachment) => ({
          file: attachment.file,
          isInline: attachment.isInline,
        })),
      });

      setReplyText("");
      setStatusId("awaiting_agent");
      clearPendingAttachments();
      showToast(
        messageType === "note"
          ? "Catatan berhasil ditambahkan."
          : "Balasan berhasil dikirim.",
        "success",
      );

      if (messageType === "email" && statusId === "awaiting_user") {
        void queryClient.invalidateQueries({ queryKey: ["tickets"] });
        router.push(listHref);
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [
    clearPendingAttachments,
    listHref,
    messageType,
    ownerId,
    pendingAttachments,
    queryClient,
    replyText,
    router,
    showToast,
    statusId,
    submitReply,
    ticketId,
  ]);

  const selectedStatus = REPLY_STATUS_OPTIONS.find(
    (option) => option.value === statusId,
  );
  const selectedTab = MESSAGE_TYPE_TABS.find((tab) => tab.value === messageType);
  const canSend = replyText.trim().length > 0 && !submitReply.isPending;
  const isNote = messageType === "note";

  return (
    <div
      id="ticket-reply-composer"
      className={`rounded-xl border shadow-sm ${
        isNote ? "border-violet-200 bg-violet-50" : "border-zinc-200 bg-white"
      }`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div
        className={`flex items-center gap-1 border-b px-2 pt-2 ${
          isNote ? "border-violet-200" : "border-zinc-200"
        }`}
      >
        {MESSAGE_TYPE_TABS.map((tab) => {
          const isActive = tab.value === messageType;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setMessageType(tab.value)}
              className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? isNote
                    ? "bg-violet-100 text-violet-900"
                    : "bg-white text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <div className="ml-auto pr-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-md px-2 py-1 text-xs ${
              isNote
                ? "text-violet-800 hover:bg-violet-100"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
            title="Attach file"
          >
            Attach
          </button>
        </div>
      </div>

      <div className="p-4">
        {selectedTab ? (
          <p
            className={`mb-3 text-xs ${
              isNote ? "text-violet-700" : "text-zinc-500"
            }`}
          >
            {selectedTab.description}
          </p>
        ) : null}

        {!isNote ? (
          <div className="mb-3">
            <TicketSnippetPicker
              snippetContext={snippetContext}
              onSelect={handleSnippetSelect}
            />
          </div>
        ) : null}

        <textarea
          value={replyText}
          onChange={(event) => setReplyText(event.target.value)}
          onPaste={handlePaste}
          rows={5}
          placeholder={
            isNote
              ? "Tulis catatan internal untuk agent lain..."
              : "Tulis balasan ke user..."
          }
          className={`w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none ${
            isNote
              ? "border-violet-200 bg-violet-100/60 text-violet-950 focus:border-violet-400"
              : "border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400"
          }`}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpeg,.jpg,.pdf,.doc,.docx,image/png,image/jpeg,application/pdf"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              addAttachments(event.target.files);
              event.target.value = "";
            }
          }}
        />

        {pendingAttachments.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {pendingAttachments.map((attachment) => (
              <li
                key={attachment.id}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  isNote
                    ? "border-violet-200 bg-white/70"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              >
                {attachment.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.file.name}
                    className="h-10 w-10 rounded border border-zinc-200 object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded border border-zinc-200 bg-white text-[10px] font-semibold uppercase text-zinc-500">
                    file
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-900">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatFileSize(attachment.file.size)}
                    {attachment.isInline ? " · inline image" : " · attachment"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200"
                  aria-label={`Remove ${attachment.file.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <label
              htmlFor={`reply-status-${ticketId}`}
              className={`block text-xs font-medium ${
                isNote ? "text-violet-800" : "text-zinc-700"
              }`}
            >
              {isNote ? "Add as" : "Send as"}
            </label>
            <select
              id={`reply-status-${ticketId}`}
              value={statusId}
              onChange={(event) =>
                setStatusId(event.target.value as ReplyStatusId)
              }
              className={`rounded-md border bg-white px-3 py-2 text-sm outline-none ${
                isNote
                  ? "border-violet-200 text-violet-950 focus:border-violet-400"
                  : "border-zinc-200 text-zinc-900 focus:border-zinc-400"
              }`}
            >
              {REPLY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedStatus ? (
              <p
                className={`text-xs ${
                  isNote ? "text-violet-600" : "text-zinc-500"
                }`}
              >
                {selectedStatus.description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            aria-busy={submitReply.isPending}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 ${
              isNote
                ? "bg-violet-700 hover:bg-violet-800"
                : "bg-blue-700 hover:bg-blue-800"
            }`}
          >
            {submitReply.isPending
              ? "Mengirim..."
              : isNote
                ? "Add note"
                : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
