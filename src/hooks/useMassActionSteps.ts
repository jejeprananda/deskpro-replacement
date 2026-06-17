"use client";

import { useCallback, useMemo, useState } from "react";
import {
  createMassActionStep,
  type MassActionStep,
  type MassActionType,
} from "@/types/mass-action";

export function useMassActionSteps() {
  const [steps, setSteps] = useState<MassActionStep[]>([]);

  const clearSteps = useCallback(() => {
    setSteps([]);
  }, []);

  const addStep = useCallback((type: MassActionType) => {
    setSteps((current) => {
      if (current.some((step) => step.type === type)) {
        return current;
      }

      return [...current, createMassActionStep(type)];
    });
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setSteps((current) => current.filter((step) => step.id !== stepId));
  }, []);

  const updateStep = useCallback(
    (stepId: string, updater: (step: MassActionStep) => MassActionStep) => {
      setSteps((current) =>
        current.map((step) => (step.id === stepId ? updater(step) : step)),
      );
    },
    [],
  );

  return useMemo(
    () => ({
      steps,
      clearSteps,
      addStep,
      removeStep,
      updateStep,
    }),
    [addStep, clearSteps, removeStep, steps, updateStep],
  );
}

export type MassActionStepsState = ReturnType<typeof useMassActionSteps>;
