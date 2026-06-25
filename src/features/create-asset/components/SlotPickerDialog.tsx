import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@aottg2/ui";
import type { VariantCatalog } from "@/lib/api/workshop";
import { legacyGroupedSlots } from "../constants";
import { skinTypeIcon, skinTypeLabel } from "../catalog";
import { TypeChoice } from "./TypeChoice";

export function SlotPickerDialog({
  slot,
  catalog,
  open,
  onOpenChange,
  onSelect,
}: {
  slot?: string;
  catalog: VariantCatalog;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (slot: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Choose Skin Item</DialogTitle>
          <DialogDescription>Select the texture slot first. Model selection opens next when this slot needs it.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] auto-rows-fr gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.humanSkinParts.filter((item) => !legacyGroupedSlots.has(item)).map((item) => {
            const active = item === slot;
            return (
              <TypeChoice
                key={item}
                active={active}
                compact
                icon={skinTypeIcon(item)}
                title={skinTypeLabel(item)}
                onClick={() => onSelect(item)}
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
