"use client";

import { Trash2 } from "lucide-react";
import { MassActionAgentField } from "@/components/tickets/mass-action-agent-field";
import { MassActionStatusField } from "@/components/tickets/mass-action-status-field";
import { MassActionTeamField } from "@/components/tickets/mass-action-team-field";
import {
  getMassActionStepLabel,
  isMassActionStepConfigured,
  type MassActionStep,
} from "@/types/mass-action";
import type { ReplyStatusId } from "@/types/ticket-reply";

export type UpdateMassActionStep = (
  stepId: string,
  updater: (step: MassActionStep) => MassActionStep,
) => void;

interface MassActionStepRowProps {
  step: MassActionStep;
  index: number;
  onRemove: () => void;
  onUpdate: UpdateMassActionStep;
}

export function MassActionStepRow({
  step,
  index,
  onRemove,
  onUpdate,
}: MassActionStepRowProps) {
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
