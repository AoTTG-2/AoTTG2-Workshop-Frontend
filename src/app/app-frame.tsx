"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Aottg2Theme, Toaster } from "@aottg2/ui";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AppShell, RequireAuth } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { queryClient } from "../lib/queryClient";

type WorkshopTheme = "light" | "dark";

export default function AppFrame({ children, requireAuth = false }: { children: ReactNode; requireAuth?: boolean }) {
  const [theme, setTheme] = useState<WorkshopTheme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("workshop-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("workshop-theme", theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <Aottg2Theme theme={theme} palette="workshop" global>
        <AuthProvider>
          <AppShell theme={theme} onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
            {requireAuth ? <RequireAuth>{children}</RequireAuth> : children}
          </AppShell>
          <Toaster />
        </AuthProvider>
      </Aottg2Theme>
    </QueryClientProvider>
  );
}
