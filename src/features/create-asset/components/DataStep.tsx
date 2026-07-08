import { Button } from "@aottg2/ui";
import type { VariantCatalog, WorkshopAsset } from "@/lib/api/workshop";
import { compatibilityVariantOptions } from "../catalog";
import { shifterTargets } from "../constants";
import type { AddonForm, AssetKind, CustomLogicForm, MapForm, ShifterSkinSetForm, SkyboxSkinSetForm, VariantTargetForm } from "../types";
import { AddSetItemSourceDialog } from "./AddSetItemSourceDialog";
import { AssetPickerDialog } from "./AssetPickerDialog";
import { AddonDataFields, CustomLogicDataFields, MapDataFields } from "./ExperienceDataFields";
import { FlatTextureField } from "./FlatTextureField";
import { SkinTargetCard } from "./SkinTargetCard";
import { SkyboxFaceGrid, SkyboxViewer } from "./SkyboxFields";
import { SlotPickerDialog } from "./SlotPickerDialog";
import { VariantPickerDialog } from "./VariantPickerDialog";

export function DataStep({ addNewSetItem, addNewSetItemAsset, addon, catalog, customLogic, items, kind, map, newSetItem, newSetItemAssetOpen, newSetItemSlotOpen, newSetItemSourceOpen, newSetItemVariantInitialPhase, newSetItemVariantOpen, onUploadBusyChange, part, selectNewSetItemSlot, setAddon, setCustomLogic, setItems, setMap, setNewSetItem, setNewSetItemAssetOpen, setNewSetItemSlotOpen, setNewSetItemSourceOpen, setNewSetItemVariantOpen, setPart, setShifter, setSkybox, shifter, skybox, startAddSetItem, startAddSetItemAsset, startAddSetItemUrl, toggleNewSetItemVariant, updateItem }: DataStepProps) {
  if (kind === "map") return <MapDataFields map={map} setMap={setMap} onUploadBusyChange={(busy) => onUploadBusyChange("map", busy)} />;
  if (kind === "custom_logic") return <CustomLogicDataFields customLogic={customLogic} setCustomLogic={setCustomLogic} onUploadBusyChange={(busy) => onUploadBusyChange("custom-logic", busy)} />;
  if (kind === "addon") return <AddonDataFields addon={addon} setAddon={setAddon} onUploadBusyChange={(busy) => onUploadBusyChange("addon", busy)} />;

  if (kind === "skin_part") {
    return (
      <section className="grid gap-4 border-t border-border pt-6">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Skin Part Target</h2>
        <div className="w-full justify-self-center lg:w-[calc((100%-1rem)/2)]"><SkinTargetCard value={part} onChange={setPart} catalog={catalog} texturePlaceholder="https://i.imgur.com/hair.png" /></div>
      </section>
    );
  }

  if (kind === "skin_set") {
    return (
      <section className="grid gap-5 border-t border-border pt-6">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Skin Set Items</h2>
        {items.length === 0 ? <div className="border border-dashed border-border bg-card/40 p-6 text-sm text-muted-foreground">Press Add set item to add a skin part to this set.</div> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => (
            <SkinTargetCard key={index} value={item} onChange={(nextItem) => updateItem(index, nextItem)} catalog={catalog} texturePlaceholder="https://i.imgur.com/costume.png" allowAssetSource tall onRemove={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
          ))}
        </div>
        <div><Button type="button" variant="secondary" onClick={startAddSetItem}>Add set item</Button></div>
        <AddSetItemSourceDialog open={newSetItemSourceOpen} onOpenChange={setNewSetItemSourceOpen} onUseUrl={startAddSetItemUrl} onUseAsset={startAddSetItemAsset} />
        <SlotPickerDialog slot={newSetItem?.slot} catalog={catalog} open={newSetItemSlotOpen} onOpenChange={setNewSetItemSlotOpen} onSelect={selectNewSetItemSlot} />
        <AssetPickerDialog open={newSetItemAssetOpen} onOpenChange={setNewSetItemAssetOpen} selectedId={null} onSelect={addNewSetItemAsset} />
        {newSetItem ? (
          <VariantPickerDialog slot={newSetItem.slot} options={compatibilityVariantOptions(newSetItem.slot, catalog)} selected={newSetItem.variants} boots={newSetItem.boots ?? true} initialPhase={newSetItemVariantInitialPhase} open={newSetItemVariantOpen} onBootsChange={(boots) => setNewSetItem((current) => (current ? { ...current, boots } : current))} onOpenChange={setNewSetItemVariantOpen} onToggle={toggleNewSetItemVariant} onDone={addNewSetItem} />
        ) : null}
      </section>
    );
  }

  if (kind === "shifter_skin_set") {
    return (
      <section className="grid gap-4 border-t border-border pt-6">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Shifter Texture</h2>
        <div className="w-full justify-self-center lg:w-[calc((100%-1rem)/2)]">
          <FlatTextureField label={`${shifterTargets.find((target) => target.key === shifter.target)?.label ?? "Shifter"} Shifter`} value={shifter.textureUrl} placeholder={`https://i.imgur.com/${shifter.target}.png`} onChange={(textureUrl) => setShifter((current) => ({ ...current, textureUrl }))} />
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5 border-t border-border pt-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="grid content-start gap-4">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Skybox Textures</h2>
        <SkyboxFaceGrid value={skybox} onChange={setSkybox} />
      </div>
      <SkyboxViewer value={skybox} />
    </section>
  );
}

interface DataStepProps {
  addNewSetItem: () => void;
  addNewSetItemAsset: (asset: WorkshopAsset) => void;
  addon: AddonForm;
  catalog: VariantCatalog;
  customLogic: CustomLogicForm;
  items: VariantTargetForm[];
  kind: AssetKind;
  map: MapForm;
  newSetItem: VariantTargetForm | null;
  newSetItemAssetOpen: boolean;
  newSetItemSlotOpen: boolean;
  newSetItemSourceOpen: boolean;
  newSetItemVariantInitialPhase: "models" | "boots";
  newSetItemVariantOpen: boolean;
  onUploadBusyChange: (key: string, busy: boolean) => void;
  part: VariantTargetForm;
  selectNewSetItemSlot: (slot: string) => void;
  setAddon: (addon: AddonForm) => void;
  setCustomLogic: (customLogic: CustomLogicForm) => void;
  setItems: (update: VariantTargetForm[] | ((items: VariantTargetForm[]) => VariantTargetForm[])) => void;
  setMap: (map: MapForm) => void;
  setNewSetItem: (update: VariantTargetForm | null | ((item: VariantTargetForm | null) => VariantTargetForm | null)) => void;
  setNewSetItemAssetOpen: (open: boolean) => void;
  setNewSetItemSlotOpen: (open: boolean) => void;
  setNewSetItemSourceOpen: (open: boolean) => void;
  setNewSetItemVariantOpen: (open: boolean) => void;
  setPart: (part: VariantTargetForm) => void;
  setShifter: (update: ShifterSkinSetForm | ((shifter: ShifterSkinSetForm) => ShifterSkinSetForm)) => void;
  setSkybox: (skybox: SkyboxSkinSetForm) => void;
  shifter: ShifterSkinSetForm;
  skybox: SkyboxSkinSetForm;
  startAddSetItem: () => void;
  startAddSetItemAsset: () => void;
  startAddSetItemUrl: () => void;
  toggleNewSetItemVariant: (variant: string) => void;
  updateItem: (index: number, patch: Partial<VariantTargetForm>) => void;
}
