import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Aottg2Theme, Toaster } from "@aottg2/ui";
import App from "./App";
import { AuthProvider } from "./auth/AuthProvider";
import { queryClient } from "./lib/queryClient";
import "@aottg2/ui/styles.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Aottg2Theme theme="dark" palette="workshop" global>
        <BrowserRouter future={{ v7_startTransition: true }}>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </Aottg2Theme>
    </QueryClientProvider>
  </React.StrictMode>,
);
