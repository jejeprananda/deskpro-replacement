"use client";

import DOMPurify from "isomorphic-dompurify";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TicketAttachmentImagePreview } from "@/components/tickets/ticket-attachment-image-preview";
import { bffFetch } from "@/lib/bff-fetch";
import {
  buildAttachmentProxyUrl,
  getAttachmentAction,
  getDeskproLinkAction,
  parseDeskproFileUrl,
  resolveInlineImageBffUrl,
  rewriteMessageAttachmentUrls,
  type TicketMessageAttachment,
} from "@/types/ticket-detail";

interface TicketMessageHtmlContentProps {
  html: string;
  messageId: string;
  attachments?: TicketMessageAttachment[];
  className?: string;
}

function getFilenameFromBffUrl(bffUrl: string): string {
  try {
    const url = new URL(bffUrl, window.location.origin);
    return (
      url.searchParams.get("filename") ??
      url.searchParams.get("name") ??
      ""
    );
  } catch {
    return "";
  }
}

export function TicketMessageHtmlContent({
  html,
  messageId,
  attachments = [],
  className = "",
}: TicketMessageHtmlContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inlineBlobUrlsRef = useRef<string[]>([]);
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

  const revokeInlineBlobUrls = useCallback(() => {
    for (const url of inlineBlobUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    inlineBlobUrlsRef.current = [];
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
      revokeInlineBlobUrls();
    };
  }, [revokeInlineBlobUrls, revokePreviewObjectUrl]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    revokeInlineBlobUrls();
    const root = container;

    async function hydrateImages() {
      const images = root.querySelectorAll("img");

      for (const img of images) {
        const src = img.getAttribute("src");
        if (!src || src.startsWith("blob:") || src.startsWith("data:")) {
          continue;
        }

        const bffUrl = resolveInlineImageBffUrl(messageId, attachments, src);
        if (!bffUrl) {
          continue;
        }

        img.setAttribute("data-bff-url", bffUrl);

        try {
          const response = await bffFetch(bffUrl);
          if (!response.ok || cancelled) {
            continue;
          }

          const blob = await response.blob();
          if (cancelled) {
            continue;
          }

          const objectUrl = URL.createObjectURL(blob);
          inlineBlobUrlsRef.current.push(objectUrl);
          img.src = objectUrl;
        } catch {
          // Keep original src if hydration fails.
        }
      }
    }

    void hydrateImages();

    return () => {
      cancelled = true;
      revokeInlineBlobUrls();
    };
  }, [attachments, messageId, revokeInlineBlobUrls, sanitizedHtml]);

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
        const response = await bffFetch(bffUrl);

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

  const openPreviewFromBlob = useCallback((blobUrl: string, alt: string) => {
    setPreviewKey(`${blobUrl}-${Date.now()}`);
    setPreviewAlt(alt);
    setIsPreviewOpen(true);
    setIsPreviewLoading(false);
    setPreviewError(null);
    setPreviewUrl(blobUrl);
  }, []);

  const downloadFile = useCallback(async (bffUrl: string, filename: string) => {
    const response = await bffFetch(bffUrl);

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
        const src = img.getAttribute("src") ?? "";
        const bffUrl = img.getAttribute("data-bff-url");
        const alt = img.getAttribute("alt")?.trim() || "";
        const filename =
          getFilenameFromBffUrl(bffUrl ?? src) || alt;

        if (getAttachmentAction("", filename) !== "preview") {
          return;
        }

        event.preventDefault();

        if (src.startsWith("blob:")) {
          openPreviewFromBlob(src, alt || filename);
          return;
        }

        if (bffUrl) {
          void openPreview(bffUrl, alt || filename);
          return;
        }

        if (
          src.startsWith("/api/deskpro/files") ||
          src.startsWith("/api/deskpro/messages/")
        ) {
          void openPreview(src, alt || filename);
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
    [downloadFile, openPreview, openPreviewFromBlob],
  );

  return (
    <>
      <div
        ref={containerRef}
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
