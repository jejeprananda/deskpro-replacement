"use client";

import { useCallback, useMemo, useState } from "react";
import { useMassActionSteps } from "@/hooks/useMassActionSteps";

export function useMassActionSelection() {
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(
    () => new Set(),
  );
  const { steps, clearSteps, addStep, removeStep, updateStep } =
    useMassActionSteps();

  const panelOpen = selectedTicketIds.size > 0;

  const toggleTicket = useCallback((ticketId: string) => {
    setSelectedTicketIds((current) => {
      const next = new Set(current);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((ticketIds: string[]) => {
    setSelectedTicketIds((current) => {
      const allSelected =
        ticketIds.length > 0 && ticketIds.every((id) => current.has(id));

      if (allSelected) {
        return new Set();
      }

      return new Set(ticketIds);
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTicketIds(new Set());
    clearSteps();
  }, [clearSteps]);

  const selectionState = useMemo(
    () => ({
      selectedTicketIds,
      steps,
      panelOpen,
      toggleTicket,
      toggleAll,
      clearSelection,
      addStep,
      removeStep,
      updateStep,
    }),
    [
      addStep,
      clearSelection,
      panelOpen,
      removeStep,
      selectedTicketIds,
      steps,
      toggleAll,
      toggleTicket,
      updateStep,
    ],
  );

  return selectionState;
}

export type MassActionSelectionState = ReturnType<
  typeof useMassActionSelection
>;
