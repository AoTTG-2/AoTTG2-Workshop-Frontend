import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Aottg2Theme, Toaster } from "@aottg2/ui";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { queryClient } from "./lib/queryClient";
import "@aottg2/ui/styles.css";
import "./index.css";

type WorkshopTheme = "light" | "dark";

function WorkshopRoot() {
  const [theme, setTheme] = useState<WorkshopTheme>(() => {
    const stored = window.localStorage.getItem("workshop-theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  useEffect(() => {
    window.localStorage.setItem("workshop-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <Aottg2Theme theme={theme} palette="workshop" global>
      <BrowserRouter future={{ v7_startTransition: true }}>
        <AuthProvider>
          <App theme={theme} onToggleTheme={toggleTheme} />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </Aottg2Theme>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WorkshopRoot />
    </QueryClientProvider>
  </React.StrictMode>,
);
