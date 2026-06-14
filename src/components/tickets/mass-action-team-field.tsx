"use client";

import { useMemo } from "react";
import { useAgentTeams } from "@/hooks/useAgentTeams";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import type { MassActionStep } from "@/types/mass-action";

interface MassActionTeamFieldProps {
  step: Extract<MassActionStep, { type: "change_assigned_team" }>;
  onChange: (value: { teamId: string | null; teamName: string | null }) => void;
}

export function MassActionTeamField({
  step,
  onChange,
}: MassActionTeamFieldProps) {
  const teamsQuery = useAgentTeams();

  const options: SearchableSelectOption[] = useMemo(
    () =>
      (teamsQuery.data?.teams ?? []).map((team) => ({
        value: team.id,
        label: team.name,
        keywords: team.name,
      })),
    [teamsQuery.data?.teams],
  );

  if (teamsQuery.isError) {
    return <p className="text-xs text-red-600">Gagal memuat daftar team.</p>;
  }

  const isConfigured = step.teamId != null;

  return (
    <SearchableSelect
      value={step.teamId}
      placeholder={teamsQuery.isLoading ? "Memuat teams..." : "Select value"}
      options={options}
      disabled={teamsQuery.isLoading}
      variant={isConfigured ? "selected" : "pending"}
      onChange={(value, option) => {
        if (!value) {
          onChange({ teamId: null, teamName: null });
          return;
        }

        onChange({
          teamId: value,
          teamName: option?.label ?? value,
        });
      }}
    />
  );
}
