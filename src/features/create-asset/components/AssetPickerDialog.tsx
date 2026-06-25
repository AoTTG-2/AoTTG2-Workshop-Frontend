import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Spinner } from "@aottg2/ui";
import { Search } from "lucide-react";
import { WorkshopAssetCard } from "@/components/WorkshopAssetCard";
import { getAccessToken } from "@/auth/storage";
import { listAssets, type WorkshopAsset } from "@/lib/api/workshop";
import { cardMotionAnimate } from "../constants";
import { cardMotionInitial, cardMotionTransition } from "../motion";
import { skinTypeLabel } from "../catalog";

export function AssetPickerDialog({ open, onOpenChange, slot, selectedId, onSelect }: { open: boolean; onOpenChange: (open: boolean) => void; slot?: string; selectedId?: string | null; onSelect: (asset: WorkshopAsset) => void }) {
  const [query, setQuery] = useState("");
  const reduceMotion = useReducedMotion();
  const token = getAccessToken();
  const assetsQuery = useQuery({
    queryKey: ["workshop", "asset-picker", slot ?? "all", query],
    queryFn: () => listAssets({ mine: true, type: "skin_part", category: "human", slot, q: query, pageSize: 24 }, token),
    enabled: open,
  });

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>{slot ? `Select ${skinTypeLabel(slot)} Asset` : "Select Skin Part Asset"}</DialogTitle>
          <DialogDescription>Choose one of your published skin parts for this set item.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9 text-sm" placeholder="Search your assets" value={query} onChange={(event) => setQuery(event.target.value)} />
            <span className="sr-only">Search assets</span>
          </label>
          {assetsQuery.isLoading ? (
            <div className="grid min-h-48 place-items-center border border-border bg-card/40">
              <Spinner size="sm" variant="primary" label="Loading assets" />
            </div>
          ) : assetsQuery.isError ? (
            <div className="border border-border bg-card/40 p-6 text-sm text-muted-foreground">Could not load your assets.</div>
          ) : assetsQuery.data?.assets.length ? (
            <div className="grid max-h-[62vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
              {assetsQuery.data.assets.map((asset, index) => {
                const selected = asset.id === selectedId;
                return (
                  <motion.div key={asset.id} className={`relative z-0 hover:z-50 focus-within:z-50 ${selected ? "ring-2 ring-primary" : ""}`} initial={cardMotionInitial(reduceMotion, 10)} animate={cardMotionAnimate} transition={cardMotionTransition(Math.min(index, 12) * 0.025)}>
                    <WorkshopAssetCard asset={asset} onOpen={() => onSelect(asset)} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="border border-border bg-card/40 p-6 text-sm text-muted-foreground">No matching skin parts yet.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
