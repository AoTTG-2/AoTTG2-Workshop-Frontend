import type { Metadata } from "next";
import { Suspense } from "react";
import AppFrame from "../app-frame";
import { CreatorsView } from "./creators-view";

export const metadata: Metadata = {
  title: "Creators | AoTTG2 Workshop",
  description: "Find AoTTG2 Workshop creators to follow.",
  alternates: { canonical: "/creators" },
};

export default function CreatorsPage() {
  return (
    <AppFrame>
      <Suspense fallback={<div className="grid min-h-64 place-items-center text-sm text-muted-foreground">Loading creators...</div>}>
        <CreatorsView />
      </Suspense>
    </AppFrame>
  );
}
