"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TicketAttachmentImagePreview } from "@/components/tickets/ticket-attachment-image-preview";
import { BFF_FETCH_OPTIONS } from "@/lib/bff-fetch";
import {
  buildMessageAttachmentUrl,
  getAttachmentDisposition,
  type TicketMessageAttachment,
} from "@/types/ticket-detail";

type ActionState = "idle" | "loading" | "downloading" | "success" | "error";

interface TicketAttachmentActionProps {
  attachment: TicketMessageAttachment;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${Math.round(kilobytes)} kB`;
  }

  return `${(kilobytes / 1024).toFixed(1)} MB`;
}

function getStatusMessage(
  attachment: TicketMessageAttachment,
  state: ActionState,
): string | null {
  if (attachment.action !== "download") {
    return null;
  }

  switch (state) {
    case "downloading":
      return "Mengunduh file...";
    case "success":
      return "Download dimulai.";
    case "error":
      return "Gagal mengunduh. Coba lagi.";
    default:
      return null;
  }
}

function PaperclipIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 shrink-0 text-zinc-500"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M15.621 4.379a3 3 0 0 0-4.242 0l-7 7a3 3 0 0 0 4.241 4.243h.001l.497-.5a.75.75 0 0 1 1.064 1.057l-.498.501-.002.002a4.5 4.5 0 0 1-6.364-6.364l7-7a4.5 4.5 0 0 1 6.368 6.36l-3.455 3.553A2.625 2.625 0 1 1 9.52 9.52l3.45-3.451a.75.75 0 1 1 1.061 1.06l-3.45 3.451a1.125 1.125 0 0 0 1.587 1.595l3.454-3.553a3 3 0 0 0 0-4.242Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function TicketAttachmentAction({
  attachment,
}: TicketAttachmentActionProps) {
  const [state, setState] = useState<ActionState>("idle");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const isBusyRef = useRef(false);
  const previewObjectUrlRef = useRef<string | null>(null);

  const buildAttachmentUrl = useCallback(() => {
    return buildMessageAttachmentUrl(
      attachment.messageId,
      attachment.filename,
      getAttachmentDisposition(attachment.action),
    );
  }, [attachment.action, attachment.filename, attachment.messageId]);

  const revokePreviewObjectUrl = useCallback(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }, []);

  const closePreview = useCallback(() => {
    revokePreviewObjectUrl();
    setIsPreviewOpen(false);
    setPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewLoading(false);
  }, [revokePreviewObjectUrl]);

  useEffect(() => {
    return () => {
      revokePreviewObjectUrl();
    };
  }, [revokePreviewObjectUrl]);

  const handleDownload = useCallback(
    async (url: string) => {
      setState("downloading");

      try {
        const response = await fetch(url, BFF_FETCH_OPTIONS);

        if (!response.ok) {
          throw new Error("Failed to download attachment");
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = attachment.filename;
        anchor.rel = "noopener";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);

        setState("success");
        window.setTimeout(() => setState("idle"), 2500);
      } catch {
        setState("error");
        window.setTimeout(() => setState("idle"), 3000);
      }
    },
    [attachment.filename],
  );

  const handlePreview = useCallback(
    async (url: string) => {
      setIsPreviewOpen(true);
      setIsPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      revokePreviewObjectUrl();

      try {
        const response = await fetch(url, BFF_FETCH_OPTIONS);

        if (!response.ok) {
          throw new Error("Failed to load preview");
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        previewObjectUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
      } catch {
        setPreviewError("Gagal memuat preview.");
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [revokePreviewObjectUrl],
  );

  const handleClick = useCallback(async () => {
    if (isBusyRef.current) {
      return;
    }

    isBusyRef.current = true;
    setState("loading");

    try {
      const url = buildAttachmentUrl();

      switch (attachment.action) {
        case "preview":
          await handlePreview(url);
          setState("idle");
          break;
        case "openTab":
          window.open(url, "_blank", "noopener,noreferrer");
          setState("idle");
          break;
        default:
          await handleDownload(url);
          break;
      }
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 3000);
    } finally {
      isBusyRef.current = false;
    }
  }, [attachment.action, buildAttachmentUrl, handleDownload, handlePreview]);

  const statusMessage = getStatusMessage(attachment, state);
  const isBusy = state === "loading" || state === "downloading";

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => void handleClick()}
          disabled={isBusy}
          aria-busy={isBusy}
          aria-live="polite"
          className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 transition-opacity hover:bg-zinc-50 disabled:cursor-wait disabled:opacity-70"
        >
          {isBusy ? (
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-r-transparent"
              aria-hidden="true"
            />
          ) : (
            <PaperclipIcon />
          )}
          <span className="truncate max-w-[200px]">{attachment.filename}</span>
          <span className="shrink-0 text-zinc-500">
            {formatFileSize(attachment.filesize)}
          </span>
        </button>
        {statusMessage ? (
          <p
            className={`mt-1 text-xs ${
              state === "error" ? "text-red-600" : "text-zinc-600"
            }`}
          >
            {statusMessage}
          </p>
        ) : null}
      </div>
      {isPreviewOpen ? (
        <TicketAttachmentImagePreview
          key={previewUrl ?? `${attachment.id}-loading`}
          src={previewUrl}
          alt={attachment.filename}
          isLoading={isPreviewLoading}
          errorMessage={previewError}
          onClose={closePreview}
        />
      ) : null}
    </>
  );
}
