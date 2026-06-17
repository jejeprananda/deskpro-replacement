"use client";

import { useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { TicketActionsDialog } from "@/components/tickets/ticket-actions-dialog";
import { TicketReplySubmitDialog } from "@/components/tickets/ticket-reply-submit-dialog";
import { TicketPersonalSnippetPicker } from "@/components/tickets/ticket-personal-snippet-picker";
import { TicketSnippetPicker } from "@/components/tickets/ticket-snippet-picker";
import { PaperclipIcon } from "@/components/ui/attachment-icons";
import { useSubmitTicketReply } from "@/hooks/useSubmitTicketReply";
import { useTicketFilters } from "@/hooks/useTicketFilters";
import type { TicketDetailHeaderPatch } from "@/lib/ticket-detail-header";
import type { SnippetVariables } from "@/lib/snippet-content";
import {
  getDefaultReplyStatus,
  type ReplyMessageType,
  type ReplyStatusId,
  type ReplySubmitProgress,
  type ReplySubmitStage,
} from "@/types/ticket-reply";

const MAX_TEXTAREA_HEIGHT = 320;

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
  ticketRef: string;
  ownerId?: string | null;
  listHref: string;
  snippetContext: SnippetVariables;
  onActionsApplied?: (patch: TicketDetailHeaderPatch) => void;
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
  ticketRef,
  ownerId = null,
  listHref,
  snippetContext,
  onActionsApplied,
}: TicketReplyComposerProps) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<ReplySubmitProgress | null>(
    null,
  );
  const [submitAttachmentCount, setSubmitAttachmentCount] = useState(0);
  const lastSubmitStageRef = useRef<ReplySubmitStage>("preparing");
  const shouldRedirectAfterSuccessRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { returnToTicketsList } = useTicketFilters();
  const [messageType, setMessageType] = useState<ReplyMessageType>("email");
  const [replyText, setReplyText] = useState("");
  const [statusId, setStatusId] = useState<ReplyStatusId>(() =>
    getDefaultReplyStatus("email"),
  );
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
  const submitReply = useSubmitTicketReply();

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight, replyText]);

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

  const handleSnippetSelect = useCallback(
    (plainText: string) => {
      setReplyText((current) => {
        const separator = current.trim() ? "\n\n" : "";
        return current + separator + plainText;
      });
      requestAnimationFrame(() => {
        adjustTextareaHeight();
      });
    },
    [adjustTextareaHeight],
  );

  const handleSend = useCallback(async () => {
    const message = replyText.trim();
    if (!message || submitReply.isPending || submitDialogOpen) {
      return;
    }

    const attachments = pendingAttachments.map((attachment) => ({
      file: attachment.file,
      isInline: attachment.isInline,
    }));

    setSubmitDialogOpen(true);
    setSubmitProgress({ stage: "preparing" });
    setSubmitAttachmentCount(attachments.length);
    lastSubmitStageRef.current = "preparing";

    try {
      await submitReply.mutateAsync({
        ticketId,
        ownerId,
        message,
        statusId,
        messageType,
        attachments,
        onProgress: (progress) => {
          if (progress.stage !== "success" && progress.stage !== "error") {
            lastSubmitStageRef.current = progress.stage;
          }
          setSubmitProgress(progress);
        },
      });

      setReplyText("");
      setStatusId(getDefaultReplyStatus(messageType));
      clearPendingAttachments();
      requestAnimationFrame(() => {
        adjustTextareaHeight();
      });

      shouldRedirectAfterSuccessRef.current =
        messageType === "email" && statusId === "awaiting_user";

      if (shouldRedirectAfterSuccessRef.current) {
        void queryClient.invalidateQueries({ queryKey: ["tickets"] });
      }

      setSubmitProgress({ stage: "success" });
    } catch (error) {
      setSubmitProgress({
        stage: "error",
        message: getErrorMessage(error),
        failedAt: lastSubmitStageRef.current,
      });
    }
  }, [
    adjustTextareaHeight,
    clearPendingAttachments,
    messageType,
    ownerId,
    pendingAttachments,
    queryClient,
    replyText,
    statusId,
    submitDialogOpen,
    submitReply,
    ticketId,
  ]);

  const handleSubmitDialogClose = useCallback(() => {
    setSubmitDialogOpen(false);
    setSubmitProgress(null);

    if (shouldRedirectAfterSuccessRef.current) {
      shouldRedirectAfterSuccessRef.current = false;
      router.push(listHref);
    }
  }, [listHref, router]);

  const selectedStatus = REPLY_STATUS_OPTIONS.find(
    (option) => option.value === statusId,
  );
  const selectedTab = MESSAGE_TYPE_TABS.find((tab) => tab.value === messageType);
  const canSend =
    replyText.trim().length > 0 && !submitReply.isPending && !submitDialogOpen;
  const isNote = messageType === "note";

  return (
    <div
      id="ticket-reply-composer"
      className={`rounded-xl border shadow-sm ${
        isNote ? "border-violet-200 bg-violet-50" : "border-border bg-surface"
      }`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div
        className={`flex items-center gap-1 border-b px-2 pt-2 ${
          isNote ? "border-violet-200" : "border-border"
        }`}
      >
        {MESSAGE_TYPE_TABS.map((tab) => {
          const isActive = tab.value === messageType;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setMessageType(tab.value);
                setStatusId(getDefaultReplyStatus(tab.value));
              }}
              className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? isNote
                    ? "bg-violet-100 text-violet-900"
                    : "bg-surface text-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-4">
        {selectedTab ? (
          <p
            className={`mb-3 text-xs ${
              isNote ? "text-violet-700" : "text-muted"
            }`}
          >
            {selectedTab.description}
          </p>
        ) : null}

        <div
          className={`relative rounded-lg border ${
            isNote
              ? "border-violet-200 bg-violet-100/60 focus-within:border-violet-400"
              : "border-border bg-surface focus-within:border-blue-500"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            onPaste={handlePaste}
            placeholder={
              isNote
                ? "Tulis catatan internal untuk agent lain..."
                : "Tulis balasan ke user..."
            }
            className={`block w-full resize-none border-0 bg-transparent px-3 pb-11 pt-2 text-sm outline-none ${
              isNote ? "text-violet-950" : "text-foreground"
            }`}
            style={{ minHeight: "120px" }}
          />

          <div
            className={`absolute inset-x-0 bottom-0 flex items-center gap-1 border-t px-2 py-1.5 ${
              isNote
                ? "border-violet-200 bg-violet-100/80"
                : "border-border bg-surface-muted/60"
            }`}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              aria-label="Attach file"
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                isNote
                  ? "text-violet-800 hover:bg-violet-200/70"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <PaperclipIcon />
              Attachment
            </button>
            <TicketSnippetPicker
              snippetContext={snippetContext}
              onSelect={handleSnippetSelect}
              buttonClassName={
                isNote
                  ? "text-violet-800 hover:bg-violet-200/70"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }
            />
            <TicketPersonalSnippetPicker
              snippetContext={snippetContext}
              onSelect={handleSnippetSelect}
              buttonClassName={
                isNote
                  ? "text-violet-800 hover:bg-violet-200/70"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }
            />
          </div>
        </div>

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
                    ? "border-violet-200 bg-surface/70"
                    : "border-border bg-surface-muted"
                }`}
              >
                {attachment.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.file.name}
                    className="h-10 w-10 rounded border border-border object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded border border-border bg-surface text-[10px] font-semibold uppercase text-muted">
                    file
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatFileSize(attachment.file.size)}
                    {attachment.isInline ? " · inline image" : " · attachment"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="rounded px-2 py-1 text-xs text-muted hover:bg-surface-muted"
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
                isNote ? "text-violet-800" : "text-foreground"
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
              className={`rounded-md border bg-surface px-3 py-2 text-sm outline-none ${
                isNote
                  ? "border-violet-200 text-violet-950 focus:border-violet-400"
                  : "border-border text-foreground focus:border-blue-500"
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
                  isNote ? "text-violet-600" : "text-muted"
                }`}
              >
                {selectedStatus.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 self-end">
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Actions
            </button>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend}
              aria-busy={submitReply.isPending}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted ${
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

      <TicketActionsDialog
        open={actionsOpen}
        ticketId={ticketId}
        ticketRef={ticketRef}
        onClose={() => setActionsOpen(false)}
        onActionsApplied={onActionsApplied}
        onSuccessComplete={() => returnToTicketsList({ resetOffset: true })}
      />

      <TicketReplySubmitDialog
        open={submitDialogOpen}
        messageType={messageType}
        attachmentCount={submitAttachmentCount}
        progress={submitProgress}
        onClose={handleSubmitDialogClose}
      />
    </div>
  );
}
