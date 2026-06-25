import type { ReactNode } from "react";
import { Label } from "@aottg2/ui";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </Label>
  );
}
