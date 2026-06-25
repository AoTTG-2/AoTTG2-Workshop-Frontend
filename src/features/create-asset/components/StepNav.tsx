import { Button } from "@aottg2/ui";
import type { WizardStep } from "../types";

export function StepNav({ steps, step, stepIndex, isEdit, onStep }: { steps: { key: WizardStep; label: string }[]; step: WizardStep; stepIndex: number; isEdit: boolean; onStep: (step: WizardStep) => void }) {
  return (
    <nav className={`grid gap-2 ${isEdit ? "sm:grid-cols-3" : "sm:grid-cols-4"}`} aria-label={isEdit ? "Edit steps" : "Publish steps"}>
      {steps.map((item, index) => (
        <Button
          key={item.key}
          type="button"
          variant={item.key === step ? "default" : "ghost"}
          className={`min-h-11 justify-start border px-3 text-left text-sm font-semibold uppercase ${index > stepIndex ? "cursor-default opacity-60" : ""}`}
          disabled={index > stepIndex}
          onClick={() => onStep(item.key)}
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
