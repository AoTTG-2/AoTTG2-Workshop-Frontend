import type { ShifterSkinSetPayload, SkinPartPayload, SkinSetItem, SkinSetPayload, SkyboxSkinSetPayload, WorkshopAsset } from "@/lib/api/workshop";
import { formatLabel } from "./format";

export function assetCategory(asset: WorkshopAsset) {
  if ((asset.type === "skin_part" || asset.type === "skin_set" || asset.type === "shifter_skin_set" || asset.type === "skybox_skin_set") && "category" in asset.payload && typeof asset.payload.category === "string") {
    return asset.payload.category;
  }

  return asset.type;
}

export function summarizeAsset(asset: WorkshopAsset) {
  if (asset.type === "skin_part" && isSkinPartPayload(asset.payload)) {
    if (isGroupedSlot(asset.payload.slot)) return `${asset.payload.slot ?? "Grouped part"} - ${summarizeGroupedSlot(asset.payload)}`;
    const variants = asset.payload.variantScope === "specific" && asset.payload.variants?.length ? `: ${asset.payload.variants.join(", ")}` : "";
    const boots = asset.payload.slot === "Costume" ? ` - Boots ${asset.payload.boots === false ? "Off" : "On"}` : "";
    return `${asset.payload.slot ?? "Skin part"}${variants}${boots}`;
  }

  if (asset.type === "skin_set" && isSkinSetPayload(asset.payload)) {
    const count = asset.payload.items?.length ?? 0;
    return `${count} set ${count === 1 ? "item" : "items"}`;
  }

  if (asset.type === "shifter_skin_set" && isShifterSkinSetPayload(asset.payload)) {
    return `${formatLabel(asset.payload.target ?? "shifter")} Shifter`;
  }

  if (asset.type === "skybox_skin_set" && isSkyboxSkinSetPayload(asset.payload)) {
    const count = [asset.payload.front, asset.payload.back, asset.payload.left, asset.payload.right, asset.payload.up, asset.payload.down].filter(Boolean).length;
    return `${count} skybox face${count === 1 ? "" : "s"}`;
  }

  return formatLabel(asset.type);
}

export function collectTextureUrls(asset: WorkshopAsset) {
  if (asset.type === "skin_part" && isSkinPartPayload(asset.payload)) {
    if (isGroupedSlot(asset.payload.slot)) return [asset.payload.textureUrls?.left, asset.payload.textureUrls?.right].filter(Boolean) as string[];
    return asset.payload.textureUrl ? [asset.payload.textureUrl] : [];
  }

  if (asset.type === "skin_set" && isSkinSetPayload(asset.payload)) {
    return (asset.payload.items ?? []).flatMap((item) => [item.textureUrl, item.textureUrls?.left, item.textureUrls?.right]).filter((url): url is string => Boolean(url));
  }

  if (asset.type === "shifter_skin_set" && isShifterSkinSetPayload(asset.payload)) {
    return asset.payload.textureUrl ? [asset.payload.textureUrl] : [];
  }

  if (asset.type === "skybox_skin_set" && isSkyboxSkinSetPayload(asset.payload)) {
    return [asset.payload.up, asset.payload.left, asset.payload.front, asset.payload.right, asset.payload.back, asset.payload.down].filter((url): url is string => Boolean(url));
  }

  return [];
}

export function summarizeSetItemDetails(item: SkinSetItem) {
  if (isGroupedSlot(item.slot)) return ` - ${summarizeGroupedSlot(item)}`;
  const variants = item.variantScope === "specific" && item.variants?.length ? ` - ${item.variants.join(", ")}` : "";
  const boots = item.slot === "Costume" ? ` - Boots ${item.boots === false ? "Off" : "On"}` : "";
  return `${variants}${boots}`;
}

export function isSkinPartPayload(payload: WorkshopAsset["payload"]): payload is SkinPartPayload {
  return "slot" in payload || "textureUrl" in payload;
}

export function isGroupedSlot(slot: string | undefined) {
  return slot === "Blades" || slot === "AHSS" || slot === "APG" || slot === "Thunderspears" || slot === "Hooks";
}

export function summarizeGroupedSlot(payload: SkinPartPayload | SkinSetItem) {
  const left = Boolean(payload.textureUrls?.left);
  const right = Boolean(payload.textureUrls?.right);
  if (payload.mirror) return "Mirror";
  if (left && right) return "Both sides";
  if (left) return "Left only";
  if (right) return "Right only";
  return "No side";
}

export function isSkinSetPayload(payload: WorkshopAsset["payload"]): payload is SkinSetPayload {
  return "items" in payload;
}

export function isShifterSkinSetPayload(payload: WorkshopAsset["payload"]): payload is ShifterSkinSetPayload {
  return "target" in payload || "textureUrl" in payload;
}

export function isSkyboxSkinSetPayload(payload: WorkshopAsset["payload"]): payload is SkyboxSkinSetPayload {
  return "front" in payload || "back" in payload || "left" in payload || "right" in payload || "up" in payload || "down" in payload;
}
