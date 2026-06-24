"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Aottg2Theme, Toaster } from "@aottg2/ui";
import type { ReactNode } from "react";
import { AppShell, RequireAuth } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { ExternalLinkGuard } from "../components/ExternalLinkGuard";
import { queryClient } from "../lib/queryClient";

export default function AppFrame({ children, requireAuth = false }: { children: ReactNode; requireAuth?: boolean }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Aottg2Theme theme="dark" palette="workshop" global>
        <AuthProvider>
          <AppShell>
            {requireAuth ? <RequireAuth>{children}</RequireAuth> : children}
          </AppShell>
          <ExternalLinkGuard />
          <Toaster />
        </AuthProvider>
      </Aottg2Theme>
    </QueryClientProvider>
  );
}
