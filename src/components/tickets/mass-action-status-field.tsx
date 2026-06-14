"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import {
  MASS_ACTION_STATUS_OPTIONS,
  type MassActionStep,
} from "@/types/mass-action";
import type { ReplyStatusId } from "@/types/ticket-reply";

interface MassActionStatusFieldProps {
  step: Extract<MassActionStep, { type: "change_status" }>;
  onChange: (statusId: ReplyStatusId) => void;
}

export function MassActionStatusField({
  step,
  onChange,
}: MassActionStatusFieldProps) {
  const isConfigured = step.statusId != null;
  const options: SearchableSelectOption[] = MASS_ACTION_STATUS_OPTIONS.map(
    (option) => ({
      value: option.value,
      label: option.label,
      keywords: option.value,
    }),
  );

  return (
    <SearchableSelect
      value={step.statusId}
      placeholder="Select value"
      options={options}
      variant={isConfigured ? "selected" : "pending"}
      onChange={(value) => {
        if (value === "awaiting_agent" || value === "awaiting_user") {
          onChange(value);
        }
      }}
      renderValue={(option) =>
        option ? <StatusBadge status={option.value} /> : null
      }
      renderOption={(option) => <StatusBadge status={option.value} />}
    />
  );
}
