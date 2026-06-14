"use client";

import axios from "axios";
import { Trash2 } from "lucide-react";
import { MassActionAgentField } from "@/components/tickets/mass-action-agent-field";
import { MassActionStatusField } from "@/components/tickets/mass-action-status-field";
import { MassActionTeamField } from "@/components/tickets/mass-action-team-field";
import { MassActionTypePicker } from "@/components/tickets/mass-action-type-picker";
import type { MassActionSelectionState } from "@/hooks/useMassActionSelection";
import { useSubmitMassActions } from "@/hooks/useSubmitMassActions";
import { useToastStore } from "@/stores/toast.store";
import {
  canApplyMassActions,
  getMassActionStepLabel,
  isMassActionStepConfigured,
  MASS_ACTION_OPTIONS,
  type MassActionStep,
  type MassActionType,
} from "@/types/mass-action";
import type { ReplyStatusId } from "@/types/ticket-reply";

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

function MassActionStepRow({
  step,
  index,
  onRemove,
  onUpdate,
}: {
  step: MassActionStep;
  index: number;
  onRemove: () => void;
  onUpdate: MassActionSelectionState["updateStep"];
}) {
  const isConfigured = isMassActionStepConfigured(step);

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isConfigured
          ? "border-blue-200 bg-blue-50/70 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30"
          : "border-dashed border-amber-300 bg-amber-50/50 dark:border-amber-700/50 dark:bg-amber-950/20"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              isConfigured
                ? "border border-blue-600 bg-blue-600 text-white"
                : "border border-amber-400 bg-amber-100 text-amber-800"
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {getMassActionStepLabel(step)}
            </span>
            <span
              className={`text-xs font-medium ${
                isConfigured
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {isConfigured ? "Configured" : "Select a value"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-red-600"
          aria-label={`Remove ${getMassActionStepLabel(step)}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {step.type === "change_status" ? (
        <MassActionStatusField
          step={step}
          onChange={(statusId: ReplyStatusId) => {
            onUpdate(step.id, (current) =>
              current.type === "change_status"
                ? { ...current, statusId }
                : current,
            );
          }}
        />
      ) : step.type === "change_assigned_agent" ? (
        <MassActionAgentField
          step={step}
          onChange={(value) => {
            onUpdate(step.id, (current) =>
              current.type === "change_assigned_agent"
                ? {
                    ...current,
                    agentId: value.agentId,
                    agentLabel: value.agentLabel,
                    isUnassign: value.isUnassign,
                  }
                : current,
            );
          }}
        />
      ) : (
        <MassActionTeamField
          step={step}
          onChange={(value) => {
            onUpdate(step.id, (current) =>
              current.type === "change_assigned_team"
                ? {
                    ...current,
                    teamId: value.teamId,
                    teamName: value.teamName,
                  }
                : current,
            );
          }}
        />
      )}
    </div>
  );
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

  const showToast = useToastStore((state) => state.showToast);
  const submitMassActions = useSubmitMassActions();

  const canApply = canApplyMassActions(selectedTicketIds.size, steps);
  const isPending = submitMassActions.isPending;

  function handleAddAction(type: MassActionType) {
    addStep(type);
  }

  async function handleApply() {
    if (!canApply || isPending) {
      return;
    }

    const ticketCount = selectedTicketIds.size;

    try {
      await submitMassActions.mutateAsync({
        ids: [...selectedTicketIds],
        steps,
      });

      showToast(
        `Mass actions applied to ${ticketCount} ticket${ticketCount === 1 ? "" : "s"}.`,
        "success",
      );
      clearSelection();
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  const usedTypes = steps.map((step) => step.type);

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">Mass Actions</h2>
        <button
          type="button"
          onClick={clearSelection}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-muted"
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
          {isPending ? "Applying…" : "Apply"}
        </button>
      </div>
    </aside>
  );
}
