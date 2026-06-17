import { z } from "zod";
import { replyStatusIdSchema, type ReplyStatusId } from "@/types/ticket-reply";

export type MassActionType =
  | "change_status"
  | "change_assigned_agent"
  | "change_assigned_team";

export type MassActionStep =
  | {
      id: string;
      type: "change_status";
      statusId: ReplyStatusId | null;
    }
  | {
      id: string;
      type: "change_assigned_agent";
      agentId: string | null;
      agentLabel: string | null;
      isUnassign: boolean;
    }
  | {
      id: string;
      type: "change_assigned_team";
      teamId: string | null;
      teamName: string | null;
    };

export const MASS_ACTION_OPTIONS: Array<{
  type: MassActionType;
  label: string;
}> = [
  { type: "change_status", label: "Change Status" },
  { type: "change_assigned_agent", label: "Change Assigned Agent" },
  { type: "change_assigned_team", label: "Change Assigned Team" },
];

export const MASS_ACTION_STATUS_OPTIONS: Array<{
  value: ReplyStatusId;
  label: string;
}> = [
  { value: "awaiting_agent", label: "Awaiting Agent" },
  { value: "awaiting_user", label: "Awaiting User" },
];

export function getMassActionStepLabel(step: MassActionStep): string {
  switch (step.type) {
    case "change_status":
      return "Change Status";
    case "change_assigned_agent":
      return "Change Assigned Agent";
    case "change_assigned_team":
      return "Change Assigned Team";
  }
}

export function createMassActionStep(type: MassActionType): MassActionStep {
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (type === "change_status") {
    return { id, type: "change_status", statusId: null };
  }

  if (type === "change_assigned_team") {
    return { id, type: "change_assigned_team", teamId: null, teamName: null };
  }

  return {
    id,
    type: "change_assigned_agent",
    agentId: null,
    agentLabel: null,
    isUnassign: false,
  };
}

export function isMassActionStepConfigured(step: MassActionStep): boolean {
  switch (step.type) {
    case "change_status":
      return step.statusId != null;
    case "change_assigned_agent":
      return step.isUnassign || step.agentId != null;
    case "change_assigned_team":
      return step.teamId != null;
  }
}

export type TicketsMassActionParams = {
  setStatus?: ReplyStatusId;
  assign?: {
    agent?: string;
    team?: string;
  };
  customFields: [];
};

export type SubmitTicketsMassActionsResponse = {
  success: true;
};

const massActionStepSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("change_status"),
    statusId: replyStatusIdSchema.nullable(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("change_assigned_agent"),
    agentId: z.string().nullable(),
    agentLabel: z.string().nullable(),
    isUnassign: z.boolean(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("change_assigned_team"),
    teamId: z.string().nullable(),
    teamName: z.string().nullable(),
  }),
]);

export const submitTicketsMassActionsBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one ticket is required"),
  steps: z.array(massActionStepSchema).min(1, "At least one action is required"),
});

export type SubmitTicketsMassActionsBody = z.infer<
  typeof submitTicketsMassActionsBodySchema
>;

export function buildTicketsMassActionParams(
  steps: MassActionStep[],
): TicketsMassActionParams {
  const params: TicketsMassActionParams = { customFields: [] };
  const assign: NonNullable<TicketsMassActionParams["assign"]> = {};

  for (const step of steps) {
    if (!isMassActionStepConfigured(step)) {
      continue;
    }

    switch (step.type) {
      case "change_status":
        params.setStatus = step.statusId!;
        break;
      case "change_assigned_agent":
        assign.agent = step.isUnassign ? "" : step.agentId!;
        break;
      case "change_assigned_team":
        assign.team = step.teamId!;
        break;
    }
  }

  if (Object.keys(assign).length > 0) {
    params.assign = assign;
  }

  return params;
}

export function canApplyMassActions(
  selectedCount: number,
  steps: MassActionStep[],
): boolean {
  return (
    selectedCount > 0 &&
    steps.length > 0 &&
    steps.every(isMassActionStepConfigured)
  );
}

export type TicketActionHeaderPatch = {
  status?: string | null;
  assignedAgent?: string | null;
};

export function buildHeaderPatchFromMassActionSteps(
  steps: MassActionStep[],
): TicketActionHeaderPatch {
  const patch: TicketActionHeaderPatch = {};

  for (const step of steps) {
    if (!isMassActionStepConfigured(step)) {
      continue;
    }

    switch (step.type) {
      case "change_status":
        patch.status = step.statusId;
        break;
      case "change_assigned_agent":
        patch.assignedAgent = step.isUnassign ? null : step.agentLabel;
        break;
      case "change_assigned_team":
        break;
    }
  }

  return patch;
}

export type MassActionSubmitStage =
  | "preparing"
  | "submitting"
  | "success"
  | "error";

export type MassActionSubmitProgress =
  | { stage: "preparing" }
  | { stage: "submitting" }
  | { stage: "success" }
  | {
      stage: "error";
      message: string;
      failedAt?: Exclude<MassActionSubmitStage, "success" | "error">;
    };

export function getMassActionSubmitTitle(
  ticketCount: number,
  progress: MassActionSubmitProgress | null,
): string {
  const isSingle = ticketCount === 1;

  if (progress?.stage === "success") {
    return isSingle ? "Action diterapkan" : "Mass action diterapkan";
  }

  if (progress?.stage === "error") {
    return isSingle ? "Gagal menerapkan action" : "Gagal menerapkan mass action";
  }

  return isSingle ? "Menerapkan action..." : "Menerapkan mass action...";
}

export function getMassActionSubmitResultMessage(
  ticketCount: number,
  progress: MassActionSubmitProgress | null,
): string | null {
  if (progress?.stage === "success") {
    return ticketCount === 1
      ? "Action berhasil diterapkan."
      : `Action berhasil diterapkan ke ${ticketCount} tickets.`;
  }

  if (progress?.stage === "error") {
    return progress.message;
  }

  return null;
}
