import { Backpack, Badge, Cable, Cloud, Cog, Crown, Eye, Flag, Glasses, Hand, Palette, Rocket, Shield, Shirt, Smile, Sparkles, UserRound, Zap } from "lucide-react";
import type { VariantCatalog, WorkshopAsset, WorkshopVariantOption } from "@/lib/api/workshop";
import { groupedSlots, skinTypeLabels } from "./constants";
import type { VariantTargetForm } from "./types";
import { toCatalogOption, variantDisplayLabel } from "./variants";

export function compatibilityVariantOptions(slot: string, catalog: VariantCatalog) {
  return catalog.humanCompatibilityVariants?.[slot] ?? [];
}

export function isCompatibilitySlot(slot: string, catalog: VariantCatalog) {
  return catalog.humanCompatibilitySlots?.includes(slot) ?? compatibilityVariantOptions(slot, catalog).length > 0;
}

export function isHookSlot(slot: string) {
  return slot === "HookL" || slot === "HookR";
}

export function isGroupedSlot(slot: string) {
  return groupedSlots.has(slot);
}

export function isGroupedHooksSlot(slot: string) {
  return slot === "Hooks";
}

export function isCostumeSlot(slot: string) {
  return slot === "Costume";
}

export function targetSlotPatch(value: VariantTargetForm, slot: string) {
  return {
    ...value,
    slot,
    skinAssetId: null,
    linkedAsset: null,
    variants: [],
    textureUrls: isGroupedSlot(slot) ? value.textureUrls ?? { left: "", right: "" } : undefined,
    mirror: isGroupedSlot(slot) ? value.mirror ?? false : undefined,
    hookTiling: isHookSlot(slot) ? value.hookTiling || "1" : undefined,
    hookTilings: isGroupedHooksSlot(slot) ? value.hookTilings ?? { left: "1", right: "1" } : undefined,
    boots: isCostumeSlot(slot) ? value.boots ?? true : undefined,
  };
}

export function selectedVariantOptions(value: VariantTargetForm, catalog: VariantCatalog) {
  const options = compatibilityVariantOptions(value.slot, catalog);
  return value.variants.map((variant) => options.find((option) => option.id === variant) ?? toCatalogOption(variant));
}

export function targetTitle(value: VariantTargetForm, catalog: VariantCatalog) {
  const label = skinTypeLabel(value.slot);
  if (!isCompatibilitySlot(value.slot, catalog)) return label;
  const selected = selectedVariantOptions(value, catalog);
  if (selected.length === 0) return `${label} - Choose Models`;
  if (selected.length === 1) return `${label} - ${variantDisplayLabel(selected[0])}`;
  return `${label} - ${selected.length} Models`;
}

export function bootsLabel(value: { slot?: string; boots?: boolean | null }) {
  return value.slot === "Costume" ? `Boots ${value.boots === false ? "Off" : "On"}` : "";
}

export function skinPartSlot(asset: WorkshopAsset) {
  return asset.type === "skin_part" && "slot" in asset.payload && typeof asset.payload.slot === "string" ? asset.payload.slot : "";
}

export function blankSetItem(slot: string): VariantTargetForm {
  return targetSlotPatch({ source: "url", slot, textureUrl: "", variants: [] }, slot);
}

export function skinTypeLabel(slot: string) {
  return skinTypeLabels[slot] ?? slot;
}

export function skinTypeIcon(slot: string) {
  if (slot === "Set") return <Sparkles className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Hair") return <UserRound className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Costume") return <Shirt className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Eye") return <Eye className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Glass") return <Glasses className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Face") return <Smile className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Skin") return <Hand className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Logo") return <Flag className="h-5 w-5" aria-hidden="true" />;
  if (slot === "GearL" || slot === "GearR" || slot === "Blades" || slot === "AHSS" || slot === "APG") return <Cog className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Gas") return <Cloud className="h-5 w-5" aria-hidden="true" />;
  if (slot === "WeaponTrail") return <Zap className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Horse") return <Shield className="h-5 w-5" aria-hidden="true" />;
  if (slot === "ThunderspearL" || slot === "ThunderspearR" || slot === "Thunderspears") return <Rocket className="h-5 w-5" aria-hidden="true" />;
  if (slot === "HookL" || slot === "HookR" || slot === "Hooks") return <Cable className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Hat") return <Crown className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Head") return <Badge className="h-5 w-5" aria-hidden="true" />;
  if (slot === "Back") return <Backpack className="h-5 w-5" aria-hidden="true" />;
  return <Palette className="h-5 w-5" aria-hidden="true" />;
}

export type { WorkshopVariantOption };
