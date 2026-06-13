"use client";

import { useCallback, useEffect, useState } from "react";

interface TicketAttachmentImagePreviewProps {
  src: string | null;
  alt: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function TicketAttachmentImagePreview({
  src,
  alt,
  isLoading = false,
  errorMessage = null,
  onClose,
}: TicketAttachmentImagePreviewProps) {
  const [zoom, setZoom] = useState(1);

  const zoomIn = useCallback(() => {
    setZoom((current) => clampZoom(current + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => clampZoom(current - ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (isLoading || errorMessage || !src) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      }

      if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      }

      if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [errorMessage, isLoading, onClose, resetZoom, src, zoomIn, zoomOut]);

  const zoomPercent = Math.round(zoom * 100);
  const canZoomOut = zoom > MIN_ZOOM;
  const canZoomIn = zoom < MAX_ZOOM;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={!canZoomOut || isLoading || Boolean(errorMessage) || !src}
            aria-label="Perkecil gambar"
            className="rounded-md bg-black/50 px-3 py-1 text-sm text-white hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zoom out
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={!canZoomIn || isLoading || Boolean(errorMessage) || !src}
            aria-label="Perbesar gambar"
            className="rounded-md bg-black/50 px-3 py-1 text-sm text-white hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Zoom in
          </button>
          <button
            type="button"
            onClick={resetZoom}
            disabled={zoom === 1 || isLoading || Boolean(errorMessage) || !src}
            aria-label="Reset zoom"
            className="rounded-md bg-black/50 px-3 py-1 text-sm text-white hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {zoomPercent}%
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-black/50 px-3 py-1 text-sm text-white hover:bg-black/70"
        >
          Tutup
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-white">
            <span
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white border-r-transparent"
              aria-hidden="true"
            />
            <p className="text-sm">Memuat preview...</p>
          </div>
        ) : null}
        {!isLoading && errorMessage ? (
          <p className="max-w-md text-center text-sm text-white">{errorMessage}</p>
        ) : null}
        {!isLoading && !errorMessage && src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            style={{ transform: `scale(${zoom})` }}
            className="max-h-[85vh] max-w-full origin-center rounded-md object-contain transition-transform duration-150"
            onClick={(event) => event.stopPropagation()}
          />
        ) : null}
      </div>
    </div>
  );
}
