"use client";

import DOMPurify from "isomorphic-dompurify";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TicketAttachmentImagePreview } from "@/components/tickets/ticket-attachment-image-preview";
import { BFF_FETCH_OPTIONS } from "@/lib/bff-fetch";
import {
  buildAttachmentProxyUrl,
  getAttachmentAction,
  getDeskproLinkAction,
  parseDeskproFileUrl,
  rewriteMessageAttachmentUrls,
} from "@/types/ticket-detail";

interface TicketMessageHtmlContentProps {
  html: string;
  className?: string;
}

export function TicketMessageHtmlContent({
  html,
  className = "",
}: TicketMessageHtmlContentProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewAlt, setPreviewAlt] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewKey, setPreviewKey] = useState("");
  const previewObjectUrlRef = useRef<string | null>(null);

  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(rewriteMessageAttachmentUrls(html)),
    [html],
  );

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
    setPreviewAlt("");
    setPreviewError(null);
    setIsPreviewLoading(false);
  }, [revokePreviewObjectUrl]);

  useEffect(() => {
    return () => {
      revokePreviewObjectUrl();
    };
  }, [revokePreviewObjectUrl]);

  const openPreview = useCallback(
    async (bffUrl: string, alt: string) => {
      setPreviewKey(`${bffUrl}-${Date.now()}`);
      setPreviewAlt(alt);
      setIsPreviewOpen(true);
      setIsPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      revokePreviewObjectUrl();

      try {
        const response = await fetch(bffUrl, BFF_FETCH_OPTIONS);

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

  const downloadFile = useCallback(async (bffUrl: string, filename: string) => {
    const response = await fetch(bffUrl, BFF_FETCH_OPTIONS);

    if (!response.ok) {
      throw new Error("Failed to download file");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const img = (event.target as HTMLElement).closest("img");
      if (img) {
        const src = img.getAttribute("src");
        if (src?.startsWith("/api/deskpro/files")) {
          const url = new URL(src, window.location.origin);
          const filename = url.searchParams.get("name") ?? "";

          if (getAttachmentAction("", filename) === "preview") {
            event.preventDefault();
            void openPreview(src, img.getAttribute("alt")?.trim() || filename);
          }
        }

        return;
      }

      const anchor = (event.target as HTMLElement).closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href) {
        return;
      }

      const parsed = parseDeskproFileUrl(href);
      if (!parsed) {
        return;
      }

      const action = getDeskproLinkAction(href);
      if (!action) {
        return;
      }

      event.preventDefault();

      const bffUrl = buildAttachmentProxyUrl(parsed.fileKey, parsed.filename);
      const label = anchor.textContent?.trim() || parsed.filename;

      switch (action) {
        case "preview":
          void openPreview(bffUrl, label);
          break;
        case "openTab":
          window.open(bffUrl, "_blank", "noopener,noreferrer");
          break;
        default:
          void downloadFile(bffUrl, parsed.filename).catch(() => {
            window.alert("Gagal mengunduh file.");
          });
          break;
      }
    },
    [downloadFile, openPreview],
  );

  return (
    <>
      <div
        className={`${className} [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-md`}
        onClick={handleClick}
        dangerouslySetInnerHTML={{
          __html: sanitizedHtml,
        }}
      />
      {isPreviewOpen ? (
        <TicketAttachmentImagePreview
          key={previewKey}
          src={previewUrl}
          alt={previewAlt}
          isLoading={isPreviewLoading}
          errorMessage={previewError}
          onClose={closePreview}
        />
      ) : null}
    </>
  );
}
