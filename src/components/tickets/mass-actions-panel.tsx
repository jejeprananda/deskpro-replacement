"use client";

import axios from "axios";
import { useCallback, useRef, useState } from "react";
import { MassActionStepRow } from "@/components/tickets/mass-action-step-row";
import { MassActionSubmitDialog } from "@/components/tickets/mass-action-submit-dialog";
import { MassActionTypePicker } from "@/components/tickets/mass-action-type-picker";
import type { MassActionSelectionState } from "@/hooks/useMassActionSelection";
import { useSubmitMassActions } from "@/hooks/useSubmitMassActions";
import { useTicketFilters } from "@/hooks/useTicketFilters";
import {
  canApplyMassActions,
  MASS_ACTION_OPTIONS,
  type MassActionSubmitProgress,
  type MassActionSubmitStage,
  type MassActionType,
} from "@/types/mass-action";

interface MassActionsPanelProps {
  selection: MassActionSelectionState;
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

  return "Failed to apply mass actions. Please try again.";
}

export function MassActionsPanel({ selection }: MassActionsPanelProps) {
  const {
    selectedTicketIds,
    steps,
    clearSelection,
    addStep,
    removeStep,
    updateStep,
  } = selection;

  const submitMassActions = useSubmitMassActions();
  const { returnToTicketsList } = useTicketFilters();
  const [submitProgressOpen, setSubmitProgressOpen] = useState(false);
  const [submitProgress, setSubmitProgress] =
    useState<MassActionSubmitProgress | null>(null);
  const [submitTicketCount, setSubmitTicketCount] = useState(0);
  const lastSubmitStageRef = useRef<MassActionSubmitStage>("preparing");

  const canApply = canApplyMassActions(selectedTicketIds.size, steps);
  const isPending = submitMassActions.isPending || submitProgressOpen;

  function handleAddAction(type: MassActionType) {
    addStep(type);
  }

  const handleProgressClose = useCallback(() => {
    const wasSuccess = submitProgress?.stage === "success";

    setSubmitProgressOpen(false);
    setSubmitProgress(null);

    if (wasSuccess) {
      clearSelection();
      void returnToTicketsList({ resetOffset: true });
    }
  }, [clearSelection, returnToTicketsList, submitProgress?.stage]);

  async function handleApply() {
    if (!canApply || isPending) {
      return;
    }

    const ticketIds = [...selectedTicketIds];

    setSubmitTicketCount(ticketIds.length);
    setSubmitProgressOpen(true);
    setSubmitProgress({ stage: "preparing" });
    lastSubmitStageRef.current = "preparing";

    try {
      await submitMassActions.mutateAsync({
        ids: ticketIds,
        steps,
        onProgress: (progress) => {
          if (progress.stage !== "success" && progress.stage !== "error") {
            lastSubmitStageRef.current = progress.stage;
          }
          setSubmitProgress(progress);
        },
      });

      setSubmitProgress({ stage: "success" });
    } catch (error) {
      setSubmitProgress({
        stage: "error",
        message: getErrorMessage(error),
        failedAt: lastSubmitStageRef.current,
      });
    }
  }

  const usedTypes = steps.map((step) => step.type);

  return (
    <>
      <aside className="sticky top-6 z-10 flex w-80 max-h-[calc(100dvh-8rem)] shrink-0 flex-col self-start overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Mass Actions</h2>
          <button
            type="button"
            onClick={clearSelection}
            disabled={isPending}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="mb-4 text-xs text-muted">
            {selectedTicketIds.size} ticket
            {selectedTicketIds.size === 1 ? "" : "s"} selected
          </p>

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

        <div className="border-t border-border p-4">
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
      </aside>

      <MassActionSubmitDialog
        open={submitProgressOpen}
        ticketCount={submitTicketCount}
        progress={submitProgress}
        onClose={handleProgressClose}
      />
    </>
  );
}
