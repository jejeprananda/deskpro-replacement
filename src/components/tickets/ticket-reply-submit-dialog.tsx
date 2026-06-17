"use client";

import { useEffect } from "react";
import { Check, Loader2, X } from "lucide-react";
import type {
  ReplyMessageType,
  ReplySubmitProgress,
  ReplySubmitStage,
} from "@/types/ticket-reply";

interface TicketReplySubmitDialogProps {
  open: boolean;
  messageType: ReplyMessageType;
  attachmentCount: number;
  progress: ReplySubmitProgress | null;
  onClose: () => void;
}

type StepKey = "preparing" | "uploading" | "submitting" | "result";

type StepStatus = "pending" | "active" | "done" | "error";

type StepDefinition = {
  key: StepKey;
  label: string;
  uploadDetail?: string;
};

function getDialogTitle(messageType: ReplyMessageType, progress: ReplySubmitProgress | null) {
  const isNote = messageType === "note";

  if (progress?.stage === "success") {
    return isNote ? "Catatan ditambahkan" : "Balasan terkirim";
  }

  if (progress?.stage === "error") {
    return isNote ? "Gagal menambahkan catatan" : "Gagal mengirim balasan";
  }

  return isNote ? "Menambahkan catatan..." : "Mengirim balasan...";
}

function getResultMessage(messageType: ReplyMessageType, progress: ReplySubmitProgress | null) {
  if (progress?.stage === "success") {
    return messageType === "note"
      ? "Catatan berhasil ditambahkan."
      : "Balasan berhasil dikirim.";
  }

  if (progress?.stage === "error") {
    return progress.message;
  }

  return null;
}

function getStepStatus(
  stepKey: StepKey,
  progress: ReplySubmitProgress | null,
): StepStatus {
  if (!progress) {
    return "pending";
  }

  if (progress.stage === "success") {
    return stepKey === "result" ? "done" : "done";
  }

  if (progress.stage === "error") {
    const failedAt = progress.failedAt ?? "submitting";

    if (stepKey === "result") {
      return "error";
    }

    const order: StepKey[] = ["preparing", "uploading", "submitting", "result"];
    const failedIndex = order.indexOf(
      failedAt === "preparing"
        ? "preparing"
        : failedAt === "uploading"
          ? "uploading"
          : "submitting",
    );
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < failedIndex) {
      return "done";
    }

    if (stepIndex === failedIndex) {
      return "error";
    }

    return "pending";
  }

  const stageOrder: Record<ReplySubmitStage, number> = {
    preparing: 0,
    uploading: 1,
    submitting: 2,
    success: 4,
    error: 4,
  };

  const currentIndex =
    progress.stage === "uploading" ? 1 : stageOrder[progress.stage];

  const stepIndex =
    stepKey === "preparing"
      ? 0
      : stepKey === "uploading"
        ? 1
        : stepKey === "submitting"
          ? 2
          : 3;

  if (stepIndex < currentIndex) {
    return "done";
  }

  if (stepIndex === currentIndex) {
    return "active";
  }

  return "pending";
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "active") {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
  }

  if (status === "done") {
    return <Check className="h-4 w-4 text-emerald-600" />;
  }

  if (status === "error") {
    return <X className="h-4 w-4 text-red-600" />;
  }

  return <span className="h-2 w-2 rounded-full bg-border" />;
}

export function TicketReplySubmitDialog({
  open,
  messageType,
  attachmentCount,
  progress,
  onClose,
}: TicketReplySubmitDialogProps) {
  const isFinished = progress?.stage === "success" || progress?.stage === "error";
  const resultMessage = getResultMessage(messageType, progress);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isFinished) {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFinished, onClose, open]);

  if (!open) {
    return null;
  }

  const steps: StepDefinition[] = [
    { key: "preparing", label: "Menyiapkan pesan" },
  ];

  if (attachmentCount > 0) {
    steps.push({
      key: "uploading",
      label: "Mengunggah lampiran",
      uploadDetail:
        progress?.stage === "uploading"
          ? `(${progress.current}/${progress.total})`
          : undefined,
    });
  }

  steps.push({ key: "submitting", label: "Mengirim ke Deskpro" });
  steps.push({
    key: "result",
    label: progress?.stage === "error" ? "Gagal" : "Berhasil",
  });

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-reply-submit-dialog-title"
      onClick={() => {
        if (isFinished) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="ticket-reply-submit-dialog-title"
          className="text-base font-semibold text-foreground"
        >
          {getDialogTitle(messageType, progress)}
        </h2>

        <ol className="mt-5 space-y-3">
          {steps.map((step) => {
            const status = getStepStatus(step.key, progress);

            return (
              <li
                key={step.key}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  status === "active"
                    ? "bg-blue-50 dark:bg-blue-950/30"
                    : status === "error"
                      ? "bg-red-50 dark:bg-red-950/30"
                      : ""
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <StepIcon status={status} />
                </span>
                <span
                  className={`text-sm ${
                    status === "pending"
                      ? "text-muted"
                      : status === "error"
                        ? "font-medium text-red-700 dark:text-red-300"
                        : "font-medium text-foreground"
                  }`}
                >
                  {step.label}
                  {step.uploadDetail ? (
                    <span className="ml-1 text-muted">{step.uploadDetail}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>

        {resultMessage ? (
          <p
            className={`mt-4 text-sm ${
              progress?.stage === "error" ? "text-red-600" : "text-muted"
            }`}
          >
            {resultMessage}
          </p>
        ) : null}

        {isFinished ? (
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tutup
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
