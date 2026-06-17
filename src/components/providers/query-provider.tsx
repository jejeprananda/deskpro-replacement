"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { SessionExpiredDialog } from "@/components/ui/session-expired-dialog";
import { ToastContainer } from "@/components/ui/toast-container";
import { setupApiClient } from "@/lib/setup-api-client";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    setupApiClient();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainer />
      <SessionExpiredDialog />
    </QueryClientProvider>
  );
}
