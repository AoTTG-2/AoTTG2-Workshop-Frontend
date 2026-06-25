import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input } from "@aottg2/ui";
import { Check, Footprints, Square } from "lucide-react";
import type { VariantCatalog, WorkshopAsset } from "@/lib/api/workshop";
import { SideCard } from "@/components/SideCard";
import { bootsLabel, compatibilityVariantOptions, isCompatibilitySlot, isCostumeSlot, isGroupedHooksSlot, isGroupedSlot, isHookSlot, selectedVariantOptions, skinPartSlot, skinTypeIcon, skinTypeLabel, targetSlotPatch, targetTitle } from "../catalog";
import { displayTargetFromAsset } from "../hydrateAsset";
import type { VariantTargetForm } from "../types";
import { previewUrl, variantDisplayLabel } from "../variants";
import { AssetPickerDialog } from "./AssetPickerDialog";
import { Field } from "./Field";
import { SelectAssetButton, TexturePreviewButton, TexturePreviewPanel } from "./TexturePreview";
import { TextureUrlDialog } from "./TextureUrlDialog";
import { SlotPickerDialog } from "./SlotPickerDialog";
import { VariantPickerDialog } from "./VariantPickerDialog";

export function SkinTargetCard({
  value,
  onChange,
  catalog,
  texturePlaceholder,
  allowAssetSource = false,
  tall = false,
  onRemove,
}: {
  value: VariantTargetForm;
  onChange: (value: VariantTargetForm) => void;
  catalog: VariantCatalog;
  texturePlaceholder: string;
  allowAssetSource?: boolean;
  tall?: boolean;
  onRemove?: () => void;
}) {
  const [slotOpen, setSlotOpen] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const [variantInitialPhase, setVariantInitialPhase] = useState<"models" | "boots">("models");
  const [textureOpen, setTextureOpen] = useState(false);
  const [pairedTextureSide, setPairedTextureSide] = useState<"left" | "right" | null>(null);
  const [assetOpen, setAssetOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const compatibilityOptions = compatibilityVariantOptions(value.slot, catalog);
  const needsCompatibility = isCompatibilitySlot(value.slot, catalog);
  const needsHookTiling = isHookSlot(value.slot);
  const isGrouped = isGroupedSlot(value.slot);
  const selectedOptions = selectedVariantOptions(value, catalog);
  const isAssetSource = allowAssetSource && (value.source === "asset" || Boolean(value.skinAssetId));
  const cardTitle = isAssetSource ? `${value.linkedAsset?.title ?? skinTypeLabel(value.slot)} - Referenced Skin Part` : targetTitle(value, catalog);
  const previewHeight = tall ? "!h-56 !min-h-56" : "!h-40 !min-h-40";
  const controlHeight = tall ? "min-h-24" : "min-h-[74px]";
  const textureUrls = value.textureUrls ?? { left: "", right: "" };
  const hookTilings = value.hookTilings ?? { left: "1", right: "1" };

  function pairedTextureUrl(side: "left" | "right") {
    const own = textureUrls[side];
    const mirrored = side === "left" ? textureUrls.right : textureUrls.left;
    return own || (value.mirror ? mirrored : "");
  }

  function selectSlot(slot: string) {
    onChange(targetSlotPatch(value, slot));
    setSlotOpen(false);
    if (isCompatibilitySlot(slot, catalog)) openVariantPicker();
  }

  function toggleVariant(variant: string) {
    onChange({ ...value, variants: value.variants.includes(variant) ? value.variants.filter((item) => item !== variant) : [...value.variants, variant] });
  }

  function openVariantPicker(phase: "models" | "boots" = "models") {
    setVariantInitialPhase(phase);
    setVariantOpen(true);
  }

  function selectAsset(asset: WorkshopAsset) {
    const slot = skinPartSlot(asset) || value.slot;
    const displayTarget = displayTargetFromAsset(asset);
    onChange({ ...targetSlotPatch(value, slot), ...displayTarget, source: "asset", skinAssetId: asset.id, linkedAsset: asset });
    setAssetOpen(false);
  }

  function updatePairedTexture(side: "left" | "right", textureUrl: string) {
    onChange({ ...value, source: "url", textureUrls: { ...textureUrls, [side]: textureUrl }, textureUrl: "", skinAssetId: null, linkedAsset: null });
  }

  return (
    <SideCard
      title={
        <span className="flex h-4 items-center justify-between gap-3">
          <span className="min-w-0 truncate">{cardTitle}</span>
          {onRemove ? (
            <Button type="button" variant="ghost" className="!h-4 !min-h-4 w-4 shrink-0 p-0 font-primary text-sm leading-none text-primary-foreground hover:bg-transparent hover:text-primary-foreground/80" onClick={() => setRemoveOpen(true)}>
              X
            </Button>
          ) : null}
        </span>
      }
      className="border-l-4 border-l-primary"
      contentClassName="grid gap-4"
    >
      <div className={`grid items-stretch gap-4 ${isAssetSource && !value.skinAssetId ? "" : "sm:grid-cols-[minmax(260px,1fr)_minmax(0,1fr)]"}`}>
        {isGrouped ? (
          isAssetSource && !value.skinAssetId ? (
            <SelectAssetButton slot={value.slot} onClick={() => setAssetOpen(true)} className={previewHeight} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(["left", "right"] as const).map((side) =>
                isAssetSource ? (
                  <TexturePreviewPanel key={side} url={pairedTextureUrl(side)} label={`${side} ${skinTypeLabel(value.slot)} texture`} className={previewHeight} />
                ) : (
                  <TexturePreviewButton key={side} url={pairedTextureUrl(side)} label={`${side} ${skinTypeLabel(value.slot)} texture`} emptyLabel={`Set ${side} texture`} onClick={() => setPairedTextureSide(side)} className={previewHeight} />
                ),
              )}
            </div>
          )
        ) : isAssetSource ? (
          value.skinAssetId ? (
            <TexturePreviewPanel url={value.textureUrl} label={`${skinTypeLabel(value.slot)} texture`} className={previewHeight} />
          ) : (
            <SelectAssetButton slot={value.slot} onClick={() => setAssetOpen(true)} className={previewHeight} />
          )
        ) : (
          <TexturePreviewButton url={value.textureUrl} label={`${skinTypeLabel(value.slot)} texture`} onClick={() => setTextureOpen(true)} className={previewHeight} />
        )}
        <div className={`grid content-start gap-3 ${isAssetSource && !value.skinAssetId ? "hidden" : ""}`}>
          <Button type="button" variant="secondary" className={`${controlHeight} justify-between gap-3 px-3`} disabled={isAssetSource} onClick={() => setSlotOpen(true)}>
            <span>{skinTypeLabel(value.slot)}</span>
            {skinTypeIcon(value.slot)}
          </Button>
          {needsCompatibility ? (
            <Button type="button" variant="secondary" className={`${controlHeight} justify-between gap-3 px-3`} disabled={isAssetSource} onClick={() => openVariantPicker()}>
              <span>{selectedOptions.length === 1 ? variantDisplayLabel(selectedOptions[0]) : selectedOptions.length ? `${selectedOptions.length} Models` : "Choose Models"}</span>
              <span className="text-xs">{compatibilityOptions.length} available</span>
            </Button>
          ) : isGrouped ? (
            <div className="grid gap-3">
              <Button type="button" variant="secondary" className={`${controlHeight} justify-between gap-3 px-3`} disabled={isAssetSource} onClick={() => onChange({ ...value, mirror: !(value.mirror ?? false) })}>
                <span>Mirror</span>
                {value.mirror ? <Check className="h-5 w-5" aria-hidden="true" /> : <Square className="h-5 w-5" aria-hidden="true" />}
              </Button>
              {isGroupedHooksSlot(value.slot) ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Left Tiling">
                    <Input className="h-12 text-sm" min="0.01" step="0.01" type="number" value={hookTilings.left} disabled={isAssetSource} onChange={(event) => onChange({ ...value, hookTilings: { ...hookTilings, left: event.target.value } })} />
                  </Field>
                  <Field label="Right Tiling">
                    <Input className="h-12 text-sm" min="0.01" step="0.01" type="number" value={hookTilings.right} disabled={isAssetSource} onChange={(event) => onChange({ ...value, hookTilings: { ...hookTilings, right: event.target.value } })} />
                  </Field>
                </div>
              ) : null}
            </div>
          ) : needsHookTiling ? (
            <Field label="Hook Tiling">
              <Input className="h-12 text-sm" min="0.01" step="0.01" type="number" value={value.hookTiling || "1"} onChange={(event) => onChange({ ...value, hookTiling: event.target.value })} />
            </Field>
          ) : (
            <Button type="button" variant="secondary" className={`${controlHeight} justify-start px-3`} disabled>
              No Model Picker
            </Button>
          )}
        </div>
      </div>
      {needsCompatibility && (selectedOptions.length > 0 || isCostumeSlot(value.slot)) && (!isAssetSource || value.skinAssetId) ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => {
            const imageUrl = previewUrl(option.previewUrl);
            return (
              <Button key={option.id} type="button" variant="ghost" size="sm" className="min-h-8 gap-2 border border-border bg-primary/15 px-2 text-xs font-semibold text-primary" disabled={isAssetSource} onClick={() => toggleVariant(option.id)}>
                <span className="grid h-7 w-7 place-items-center overflow-hidden bg-muted/50">
                  {imageUrl ? <img className="h-full w-full object-contain" src={imageUrl} alt="" loading="lazy" /> : skinTypeIcon(value.slot)}
                </span>
                {variantDisplayLabel(option)}
              </Button>
            );
          })}
          {isCostumeSlot(value.slot) ? (
            <Button type="button" variant="secondary" size="sm" className="min-h-8 gap-2 border border-border px-2 text-xs font-semibold" disabled={isAssetSource} onClick={() => openVariantPicker("boots")}>
              <Footprints className="h-4 w-4" aria-hidden="true" />
              {bootsLabel(value)}
            </Button>
          ) : null}
        </div>
      ) : null}
      {onRemove ? (
        <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
          <DialogContent variant="destructive">
            <DialogHeader>
              <DialogTitle>Remove Set Item</DialogTitle>
              <DialogDescription>Remove {cardTitle} from this skin set.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRemoveOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={onRemove}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
      <TextureUrlDialog open={textureOpen} onOpenChange={setTextureOpen} value={value.textureUrl} label={skinTypeLabel(value.slot)} placeholder={texturePlaceholder} onSave={(textureUrl) => onChange({ ...value, source: "url", textureUrl, skinAssetId: null, linkedAsset: null })} />
      <TextureUrlDialog open={pairedTextureSide !== null} onOpenChange={(open) => {
        if (!open) setPairedTextureSide(null);
      }} value={pairedTextureSide ? textureUrls[pairedTextureSide] : ""} label={`${pairedTextureSide ?? "Left"} ${skinTypeLabel(value.slot)}`} placeholder={texturePlaceholder} onSave={(textureUrl) => {
        if (pairedTextureSide) updatePairedTexture(pairedTextureSide, textureUrl);
        setPairedTextureSide(null);
      }} />
      {allowAssetSource ? <AssetPickerDialog open={assetOpen} onOpenChange={setAssetOpen} slot={value.slot} selectedId={value.skinAssetId} onSelect={selectAsset} /> : null}
      <SlotPickerDialog slot={value.slot} catalog={catalog} open={slotOpen} onOpenChange={setSlotOpen} onSelect={selectSlot} />
      {!isAssetSource && needsCompatibility ? <VariantPickerDialog slot={value.slot} options={compatibilityOptions} selected={value.variants} boots={value.boots ?? true} initialPhase={variantInitialPhase} open={variantOpen} onBootsChange={(boots) => onChange({ ...value, boots })} onOpenChange={setVariantOpen} onToggle={toggleVariant} /> : null}
    </SideCard>
  );
}
