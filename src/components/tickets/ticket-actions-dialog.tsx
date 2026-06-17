"use client";

import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { MassActionStepRow } from "@/components/tickets/mass-action-step-row";
import { MassActionSubmitDialog } from "@/components/tickets/mass-action-submit-dialog";
import { MassActionTypePicker } from "@/components/tickets/mass-action-type-picker";
import { useMassActionSteps } from "@/hooks/useMassActionSteps";
import { useSubmitMassActions } from "@/hooks/useSubmitMassActions";
import type { TicketDetailHeaderPatch } from "@/lib/ticket-detail-header";
import {
  buildHeaderPatchFromMassActionSteps,
  canApplyMassActions,
  MASS_ACTION_OPTIONS,
  type MassActionSubmitProgress,
  type MassActionSubmitStage,
  type MassActionType,
} from "@/types/mass-action";

interface TicketActionsDialogProps {
  open: boolean;
  ticketId: string;
  ticketRef: string;
  onClose: () => void;
  onActionsApplied?: (patch: TicketDetailHeaderPatch) => void;
  onSuccessComplete?: () => void | Promise<void>;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Failed to apply ticket actions. Please try again.";
}

export function TicketActionsDialog({
  open,
  ticketId,
  ticketRef,
  onClose,
  onActionsApplied,
  onSuccessComplete,
}: TicketActionsDialogProps) {
  const { steps, clearSteps, addStep, removeStep, updateStep } =
    useMassActionSteps();
  const submitMassActions = useSubmitMassActions();
  const [submitProgressOpen, setSubmitProgressOpen] = useState(false);
  const [submitProgress, setSubmitProgress] =
    useState<MassActionSubmitProgress | null>(null);
  const lastSubmitStageRef = useRef<MassActionSubmitStage>("preparing");
  const appliedStepsRef = useRef(steps);

  const canApply = canApplyMassActions(1, steps);
  const isPending = submitMassActions.isPending || submitProgressOpen;
  const usedTypes = steps.map((step) => step.type);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        clearSteps();
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearSteps, isPending, onClose, open]);

  function handleClose() {
    if (isPending) {
      return;
    }

    clearSteps();
    onClose();
  }

  function handleAddAction(type: MassActionType) {
    addStep(type);
  }

  const handleProgressClose = useCallback(() => {
    const wasSuccess = submitProgress?.stage === "success";

    setSubmitProgressOpen(false);
    setSubmitProgress(null);

    if (wasSuccess) {
      clearSteps();
      onClose();
      void onSuccessComplete?.();
    }
  }, [clearSteps, onClose, onSuccessComplete, submitProgress?.stage]);

  async function handleApply() {
    if (!canApply || isPending) {
      return;
    }

    appliedStepsRef.current = steps;
    setSubmitProgressOpen(true);
    setSubmitProgress({ stage: "preparing" });
    lastSubmitStageRef.current = "preparing";

    try {
      await submitMassActions.mutateAsync({
        ids: [ticketId],
        steps,
        onProgress: (progress) => {
          if (progress.stage !== "success" && progress.stage !== "error") {
            lastSubmitStageRef.current = progress.stage;
          }
          setSubmitProgress(progress);
        },
      });

      onActionsApplied?.(
        buildHeaderPatchFromMassActionSteps(appliedStepsRef.current),
      );
      setSubmitProgress({ stage: "success" });
    } catch (error) {
      setSubmitProgress({
        stage: "error",
        message: getErrorMessage(error),
        failedAt: lastSubmitStageRef.current,
      });
    }
  }

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-actions-dialog-title"
        onClick={handleClose}
      >
        <div
          className="flex max-h-[min(90dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2
                id="ticket-actions-dialog-title"
                className="text-base font-semibold text-foreground"
              >
                Ticket Actions
              </h2>
              <p className="mt-0.5 text-sm text-muted">{ticketRef}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <MassActionStepRow
                  key={step.id}
                  step={step}
                  index={index}
                  onRemove={() => removeStep(step.id)}
                  onUpdate={updateStep}
                />
              ))}

              {usedTypes.length < MASS_ACTION_OPTIONS.length ? (
                <MassActionTypePicker
                  usedTypes={usedTypes}
                  onSelect={handleAddAction}
                />
              ) : null}
            </div>
          </div>

          <div className="border-t border-border p-5">
            <button
              type="button"
              disabled={!canApply || isPending}
              onClick={() => {
                void handleApply();
              }}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitMassActions.isPending ? "Applying…" : "Apply"}
            </button>
          </div>
        </div>
      </div>

      <MassActionSubmitDialog
        open={submitProgressOpen}
        ticketCount={1}
        ticketRef={ticketRef}
        progress={submitProgress}
        onClose={handleProgressClose}
      />
    </>
  );
}
