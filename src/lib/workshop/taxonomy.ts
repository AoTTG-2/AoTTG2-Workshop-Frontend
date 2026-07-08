import { FileArchive, FileCode2, Image, Map, Palette, Sparkles } from "lucide-react";
import type { WorkshopAssetType } from "@/lib/api/workshop";

export const SKIN_ASSET_TYPES = [
  "skin_part",
  "skin_set",
  "titan_skin_set",
  "shifter_skin_set",
  "skybox_skin_set",
  "full_preset",
] as const satisfies readonly WorkshopAssetType[];

export const EXPERIENCE_ASSET_TYPES = [
  "map",
  "custom_logic",
  "addon",
] as const satisfies readonly WorkshopAssetType[];

export type SkinAssetType = (typeof SKIN_ASSET_TYPES)[number];
export type ExperienceAssetType = (typeof EXPERIENCE_ASSET_TYPES)[number];

export const WORKSHOP_ASSET_TYPE_LABELS = {
  skin_part: "Skin Part",
  skin_set: "Skin Set",
  titan_skin_set: "Titan Skin Set",
  shifter_skin_set: "Shifter Skin Set",
  skybox_skin_set: "Skybox Skin Set",
  full_preset: "Full Preset",
  map: "Map",
  custom_logic: "Custom Logic",
  addon: "Addon",
} as const satisfies Record<WorkshopAssetType, string>;

export const EXPERIENCE_TYPE_FILTERS = [
  { label: "Custom Logic", type: "custom_logic", icon: FileCode2 },
  { label: "Maps", type: "map", icon: Map },
  { label: "Addons", type: "addon", icon: FileArchive },
] as const;

export const FEATURED_TYPE_GROUPS = [
  { label: "Skins", href: "/library", types: SKIN_ASSET_TYPES, icon: Palette },
  { label: "Experiences", href: "/library?type=map", types: EXPERIENCE_ASSET_TYPES, icon: Sparkles },
  { label: "Maps", href: "/library?type=map", types: ["map"], icon: Map },
  { label: "Custom Logic", href: "/library?type=custom_logic", types: ["custom_logic"], icon: FileCode2 },
  { label: "Addons", href: "/library?type=addon", types: ["addon"], icon: FileArchive },
  { label: "Skyboxes", href: "/library?category=skybox", types: ["skybox_skin_set"], icon: Image },
] as const;

export function isSkinAssetType(type: string): type is SkinAssetType {
  return (SKIN_ASSET_TYPES as readonly string[]).includes(type);
}

export function isExperienceAssetType(type: string): type is ExperienceAssetType {
  return (EXPERIENCE_ASSET_TYPES as readonly string[]).includes(type);
}

export function assetTypeLabel(type: string) {
  return WORKSHOP_ASSET_TYPE_LABELS[type as WorkshopAssetType] ?? formatTaxonomyLabel(type);
}

function formatTaxonomyLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
