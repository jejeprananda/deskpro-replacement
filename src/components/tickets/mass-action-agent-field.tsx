"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import type { AgentDirectoryResponse } from "@/types/agent-directory";
import type { MassActionStep } from "@/types/mass-action";

const ME_VALUE = "__me__";
const UNASSIGN_VALUE = "__unassign__";

async function fetchAgentDirectoryPage(
  page: number,
): Promise<AgentDirectoryResponse> {
  const { data } = await axios.get<AgentDirectoryResponse>(
    "/api/deskpro/agents",
    { params: { page } },
  );
  return data;
}

interface MassActionAgentFieldProps {
  step: Extract<MassActionStep, { type: "change_assigned_agent" }>;
  onChange: (value: {
    agentId: string | null;
    agentLabel: string | null;
    isUnassign: boolean;
  }) => void;
}

export function MassActionAgentField({
  step,
  onChange,
}: MassActionAgentFieldProps) {
  const [page, setPage] = useState(1);
  const userQuery = useCurrentUser();

  const pageQueries = useQueries({
    queries: Array.from({ length: page }, (_, index) => ({
      queryKey: ["agents", index + 1],
      queryFn: () => fetchAgentDirectoryPage(index + 1),
      staleTime: 300_000,
    })),
  });

  const latestPageData = pageQueries[pageQueries.length - 1]?.data;
  const isLoadingAgents = pageQueries.some((query) => query.isLoading);
  const isFetchingMore = pageQueries.some((query) => query.isFetching);

  const loadedAgents = useMemo(() => {
    const merged = new Map<string, AgentDirectoryResponse["agents"][number]>();

    for (const query of pageQueries) {
      for (const agent of query.data?.agents ?? []) {
        merged.set(agent.id, agent);
      }
    }

    return [...merged.values()];
  }, [pageQueries]);

  const currentValue = step.isUnassign
    ? UNASSIGN_VALUE
    : step.agentId === userQuery.data?.agentId && userQuery.data?.agentId
      ? ME_VALUE
      : step.agentId;

  const options: SearchableSelectOption[] = useMemo(() => {
    const staticOptions: SearchableSelectOption[] = [
      { value: ME_VALUE, label: "Me", keywords: "me current agent" },
      {
        value: UNASSIGN_VALUE,
        label: "Unassign",
        keywords: "unassign none empty",
      },
    ];

    const agentOptions = loadedAgents.map((agent) => ({
      value: agent.id,
      label: agent.label,
      keywords: `${agent.displayName ?? ""} ${agent.email ?? ""}`,
    }));

    return [...staticOptions, ...agentOptions];
  }, [loadedAgents]);

  const hasMorePages =
    latestPageData != null && latestPageData.page < latestPageData.lastPage;

  const isConfigured = step.isUnassign || step.agentId != null;

  return (
    <SearchableSelect
      value={currentValue}
      placeholder="Select value"
      options={options}
      disabled={isLoadingAgents && page === 1}
      variant={isConfigured ? "selected" : "pending"}
      onChange={(value) => {
        if (!value) {
          onChange({ agentId: null, agentLabel: null, isUnassign: false });
          return;
        }

        if (value === ME_VALUE) {
          onChange({
            agentId: userQuery.data?.agentId ?? null,
            agentLabel: "Me",
            isUnassign: false,
          });
          return;
        }

        if (value === UNASSIGN_VALUE) {
          onChange({
            agentId: null,
            agentLabel: "Unassign",
            isUnassign: true,
          });
          return;
        }

        const selected = options.find((option) => option.value === value);
        onChange({
          agentId: value,
          agentLabel: selected?.label ?? value,
          isUnassign: false,
        });
      }}
      footer={
        hasMorePages ? (
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={isFetchingMore}
            className="w-full rounded-md px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingMore ? "Loading..." : "Load more agents"}
          </button>
        ) : null
      }
    />
  );
}
