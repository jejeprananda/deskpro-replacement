"use client";

import { useEffect } from "react";
import { Check, Loader2, X } from "lucide-react";
import {
  getMassActionSubmitResultMessage,
  getMassActionSubmitTitle,
  type MassActionSubmitProgress,
  type MassActionSubmitStage,
} from "@/types/mass-action";

interface MassActionSubmitDialogProps {
  open: boolean;
  ticketCount: number;
  ticketRef?: string;
  progress: MassActionSubmitProgress | null;
  onClose: () => void;
}

type StepKey = "preparing" | "submitting" | "result";

type StepStatus = "pending" | "active" | "done" | "error";

type StepDefinition = {
  key: StepKey;
  label: string;
  detail?: string;
};

function getStepStatus(
  stepKey: StepKey,
  progress: MassActionSubmitProgress | null,
): StepStatus {
  if (!progress) {
    return "pending";
  }

  if (progress.stage === "success") {
    return "done";
  }

  if (progress.stage === "error") {
    const failedAt = progress.failedAt ?? "submitting";

    if (stepKey === "result") {
      return "error";
    }

    const order: StepKey[] = ["preparing", "submitting", "result"];
    const failedIndex = failedAt === "preparing" ? 0 : 1;
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < failedIndex) {
      return "done";
    }

    if (stepIndex === failedIndex) {
      return "error";
    }

    return "pending";
  }

  const stageOrder: Record<MassActionSubmitStage, number> = {
    preparing: 0,
    submitting: 1,
    success: 3,
    error: 3,
  };

  const currentIndex = stageOrder[progress.stage];
  const stepIndex =
    stepKey === "preparing" ? 0 : stepKey === "submitting" ? 1 : 2;

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

export function MassActionSubmitDialog({
  open,
  ticketCount,
  ticketRef,
  progress,
  onClose,
}: MassActionSubmitDialogProps) {
  const isFinished = progress?.stage === "success" || progress?.stage === "error";
  const resultMessage = getMassActionSubmitResultMessage(ticketCount, progress);

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
    { key: "preparing", label: "Menyiapkan action" },
    {
      key: "submitting",
      label: "Mengirim ke Deskpro",
      detail: ticketCount > 1 ? `(${ticketCount} tickets)` : undefined,
    },
    {
      key: "result",
      label: progress?.stage === "error" ? "Gagal" : "Berhasil",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mass-action-submit-dialog-title"
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
          id="mass-action-submit-dialog-title"
          className="text-base font-semibold text-foreground"
        >
          {getMassActionSubmitTitle(ticketCount, progress)}
        </h2>

        {ticketRef ? (
          <p className="mt-0.5 text-sm text-muted">{ticketRef}</p>
        ) : null}

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
                  {step.detail ? (
                    <span className="ml-1 text-muted">{step.detail}</span>
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
