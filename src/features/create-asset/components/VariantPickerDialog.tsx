import { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from "@aottg2/ui";
import { Footprints, Search } from "lucide-react";
import type { WorkshopVariantOption } from "@/lib/api/workshop";
import { isCostumeSlot, skinTypeLabel } from "../catalog";
import { previewUrl, variantDisplayLabel, variantGroup, variantNumber } from "../variants";
import { TypeChoice } from "./TypeChoice";

export function VariantPickerDialog({
  slot,
  options,
  selected,
  boots,
  initialPhase,
  open,
  onBootsChange,
  onOpenChange,
  onToggle,
  onDone,
}: {
  slot: string;
  options: WorkshopVariantOption[];
  selected: string[];
  boots: boolean;
  initialPhase: "models" | "boots";
  open: boolean;
  onBootsChange: (boots: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onToggle: (variant: string) => void;
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<"models" | "boots">("models");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const hasGenderGroups = options.some((option) => variantGroup(option.id));
  const hasBootsStep = isCostumeSlot(slot);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = options.filter((option) => {
    const label = variantDisplayLabel(option);
    const matchesQuery = !normalizedQuery || option.id.toLowerCase().includes(normalizedQuery) || label.toLowerCase().includes(normalizedQuery) || variantNumber(option.id) === normalizedQuery;
    const matchesGroup = group === "All" || variantGroup(option.id) === group;
    return matchesQuery && matchesGroup;
  });

  useEffect(() => {
    if (open) {
      setPhase(initialPhase);
      setQuery("");
      setGroup("All");
    }
  }, [initialPhase, open, slot]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={phase === "boots" ? "max-w-md" : "max-w-5xl"}>
        <DialogHeader>
          <DialogTitle>{phase === "boots" ? "Costume Boots" : `${skinTypeLabel(slot)} Compatible Models`}</DialogTitle>
          <DialogDescription>{phase === "boots" ? "Set the costume boots option." : "Choose every model this texture fits."}</DialogDescription>
        </DialogHeader>
        {phase === "boots" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <TypeChoice active={boots} icon={<Footprints className="h-5 w-5" aria-hidden="true" />} title="Boots On" onClick={() => onBootsChange(true)} />
            <TypeChoice active={!boots} icon={<Footprints className="h-5 w-5" aria-hidden="true" />} title="Boots Off" onClick={() => onBootsChange(false)} />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <label className="relative min-w-52 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="h-10 pl-9 text-sm" placeholder="Search HairM5, Male 5, 5" value={query} onChange={(event) => setQuery(event.target.value)} />
                <span className="sr-only">Search variants</span>
              </label>
              {hasGenderGroups
                ? ["All", "Male", "Female"].map((item) => (
                    <Button key={item} type="button" variant={group === item ? undefined : "secondary"} onClick={() => setGroup(item)}>
                      {item}
                    </Button>
                  ))
                : null}
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {filteredOptions.map((option) => {
                  const label = variantDisplayLabel(option);
                  const imageUrl = previewUrl(option.previewUrl);
                  const checked = selected.includes(option.id);
                  return (
                    <Button
                      key={option.id}
                      type="button"
                      variant={checked ? "default" : "ghost"}
                      className={`group grid h-auto min-h-44 gap-2 border p-2 text-center ${checked ? "aottg2-emboss-bg aottg2-cta-primary shadow-[0_3px_0_hsl(var(--primary)/0.45)]" : "bg-[color-mix(in_srgb,hsl(var(--input))_58%,hsl(var(--background)))] shadow-[inset_0_1px_5px_rgb(0_0_0_/_0.28),inset_0_1px_0_rgb(255_255_255_/_0.04)] hover:bg-foreground"}`}
                      onClick={() => onToggle(option.id)}
                    >
                      <span className="grid aspect-square h-28 w-full place-items-center overflow-hidden bg-muted/50">
                        {imageUrl ? <img className="max-h-full max-w-full object-contain" src={imageUrl} alt={label} loading="lazy" /> : null}
                      </span>
                      <span className={`font-primary text-lg font-semibold uppercase leading-none ${checked ? "text-primary-foreground" : "text-foreground group-hover:text-background"}`}>{label}</span>
                    </Button>
                  );
                })}
              </div>
              {filteredOptions.length === 0 ? <div className="border border-border bg-card/40 p-6 text-sm text-muted-foreground">No models match.</div> : null}
            </div>
          </div>
        )}
        <DialogFooter>
          {phase === "boots" ? (
            <Button type="button" variant="ghost" onClick={() => setPhase("models")}>
              Back
            </Button>
          ) : null}
          {phase === "boots" || !hasBootsStep ? (
            <Button type="button" variant="secondary" onClick={onDone ?? (() => onOpenChange(false))}>
              Done
            </Button>
          ) : null}
          {phase === "models" && hasBootsStep ? (
            <Button type="button" onClick={() => setPhase("boots")}>
              Next
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
