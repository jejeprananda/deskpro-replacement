"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSubmitTicketReply } from "@/hooks/useSubmitTicketReply";
import { useToastStore } from "@/stores/toast.store";
import type { ReplyStatusId } from "@/types/ticket-reply";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
]);
const ACCEPTED_EXTENSIONS = new Set([".png", ".jpeg", ".jpg"]);

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

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

interface TicketReplyComposerProps {
  ticketId: string;
  ownerId?: string | null;
  listHref: string;
}

function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return [...ACCEPTED_EXTENSIONS].some((extension) =>
    lowerName.endsWith(extension),
  );
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return "Gagal mengirim balasan. Coba lagi.";
}

export function TicketReplyComposer({
  ticketId,
  ownerId = null,
  listHref,
}: TicketReplyComposerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [replyText, setReplyText] = useState("");
  const [statusId, setStatusId] = useState<ReplyStatusId>("awaiting_user");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  const submitReply = useSubmitTicketReply();

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  const clearPendingImages = useCallback(() => {
    for (const image of pendingImagesRef.current) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setPendingImages([]);
  }, []);

  const addImages = useCallback((files: FileList | File[]) => {
    const nextImages: PendingImage[] = [];

    for (const file of files) {
      if (!isAcceptedImage(file)) {
        continue;
      }

      nextImages.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (nextImages.length === 0) {
      return;
    }

    setPendingImages((current) => [...current, ...nextImages]);
  }, []);

  useEffect(() => {
    return () => {
      for (const image of pendingImagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = event.clipboardData?.files;
      if (items && items.length > 0) {
        event.preventDefault();
        addImages(items);
      }
    },
    [addImages],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.dataTransfer.files.length > 0) {
        addImages(event.dataTransfer.files);
      }
    },
    [addImages],
  );

  const removeImage = useCallback((id: string) => {
    setPendingImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return current.filter((image) => image.id !== id);
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
      });

      setReplyText("");
      clearPendingImages();
      showToast("Balasan berhasil dikirim.", "success");

      if (statusId === "awaiting_user") {
        void queryClient.invalidateQueries({ queryKey: ["tickets"] });
        router.push(listHref);
      }
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }, [
    clearPendingImages,
    listHref,
    ownerId,
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
  const canSend = replyText.trim().length > 0 && !submitReply.isPending;

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">Reply</h3>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
        >
          Attach image
        </button>
      </div>

      <textarea
        value={replyText}
        onChange={(event) => setReplyText(event.target.value)}
        onPaste={handlePaste}
        rows={5}
        placeholder="Tulis balasan... (paste atau drop PNG/JPEG/JPG)"
        className="w-full resize-y rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpeg,.jpg,image/png,image/jpeg"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files) {
            addImages(event.target.files);
            event.target.value = "";
          }
        }}
      />

      {pendingImages.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-3">
          {pendingImages.map((image) => (
            <li key={image.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt={image.file.name}
                className="h-20 w-20 rounded-md border border-zinc-200 object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute -right-2 -top-2 rounded-full bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white"
                aria-label={`Remove ${image.file.name}`}
              >
                x
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <label
            htmlFor={`reply-status-${ticketId}`}
            className="block text-xs font-medium text-zinc-700"
          >
            Send as
          </label>
          <select
            id={`reply-status-${ticketId}`}
            value={statusId}
            onChange={(event) =>
              setStatusId(event.target.value as ReplyStatusId)
            }
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
          >
            {REPLY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {selectedStatus ? (
            <p className="text-xs text-zinc-500">{selectedStatus.description}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          aria-busy={submitReply.isPending}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-opacity hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
        >
          {submitReply.isPending ? "Mengirim..." : "Send"}
        </button>
      </div>
    </div>
  );
}
