import type { AddonPayload, CustomLogicPayload, MapPayload, ShifterSkinSetPayload, SkinPartPayload, SkinSetPayload, SkyboxSkinSetPayload, WorkshopAsset } from "@/lib/api/workshop";
import { targetSlotPatch } from "./catalog";
import { shifterTargets } from "./constants";
import type { AddonForm, AssetKind, CommonAssetForm, CustomLogicForm, MapForm, ShifterSkinSetForm, SkinCategory, SkyboxSkinSetForm, VariantTargetForm } from "./types";

export function isEditableAsset(asset: WorkshopAsset | null | undefined): asset is WorkshopAsset & { type: AssetKind } {
  return asset?.type === "skin_part" || asset?.type === "skin_set" || asset?.type === "shifter_skin_set" || asset?.type === "skybox_skin_set" || asset?.type === "map" || asset?.type === "custom_logic" || asset?.type === "addon";
}

export function categoryFromAsset(asset: WorkshopAsset | null | undefined): SkinCategory {
  if (asset?.type === "shifter_skin_set") return "shifter";
  if (asset?.type === "skybox_skin_set") return "skybox";
  return "human";
}

export function commonFromAsset(asset: WorkshopAsset | null | undefined): CommonAssetForm {
  const thumbnail = asset?.media.find((item) => item.kind === "thumbnail")?.url ?? "";
  const galleryUrls = asset?.media.filter((item) => item.kind === "gallery").map((item) => item.url).join("\n") ?? "";
  return { title: asset?.title ?? "", assetSlug: asset?.assetSlug ?? "", shortDescription: asset?.shortDescription ?? "", descriptionMarkdown: asset?.descriptionMarkdown ?? "", thumbnailUrl: thumbnail, galleryUrls, tags: asset?.tags.join(", ") ?? "" };
}

export function targetFromSkinPart(payload: SkinPartPayload | Record<string, unknown>): VariantTargetForm {
  const data = payload as SkinPartPayload;
  return { source: "url", slot: data.slot || "Hair", textureUrl: data.textureUrl || "", textureUrls: data.textureUrls ? { left: data.textureUrls.left ?? "", right: data.textureUrls.right ?? "" } : undefined, variants: Array.isArray(data.variants) ? data.variants : [], boots: data.slot === "Costume" ? data.boots ?? true : undefined, mirror: data.mirror ?? false, hookTilings: data.hookTilings ? { left: String(data.hookTilings.left ?? 1), right: String(data.hookTilings.right ?? 1) } : undefined };
}

export function displayTargetFromAsset(asset: WorkshopAsset): VariantTargetForm {
  return targetFromSkinPart(asset.payload as SkinPartPayload);
}

export function targetsFromSkinSet(payload: SkinSetPayload | Record<string, unknown>): VariantTargetForm[] {
  const items = (payload as SkinSetPayload).items;
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item) => ({ source: item.skinAssetId ? "asset" : "url", slot: item.slot || "Hair", skinAssetId: item.skinAssetId ?? null, textureUrl: item.textureUrl || "", textureUrls: item.textureUrls ? { left: item.textureUrls.left ?? "", right: item.textureUrls.right ?? "" } : undefined, variants: Array.isArray(item.variants) ? item.variants : [], boots: item.slot === "Costume" ? item.boots ?? true : undefined, mirror: item.mirror ?? false, hookTilings: item.hookTilings ? { left: String(item.hookTilings.left ?? 1), right: String(item.hookTilings.right ?? 1) } : undefined }));
}

export function shifterFromAsset(payload: ShifterSkinSetPayload | Record<string, unknown>): ShifterSkinSetForm {
  const data = payload as ShifterSkinSetPayload;
  const target = shifterTargets.some((item) => item.key === data.target) ? data.target as ShifterSkinSetForm["target"] : "eren";
  return { target, textureUrl: data.textureUrl ?? "" };
}

export function skyboxFromAsset(payload: SkyboxSkinSetPayload | Record<string, unknown>): SkyboxSkinSetForm {
  const data = payload as SkyboxSkinSetPayload;
  return { front: data.front ?? "", back: data.back ?? "", left: data.left ?? "", right: data.right ?? "", up: data.up ?? "", down: data.down ?? "" };
}

export function mapFromAsset(payload: MapPayload | Record<string, unknown>): MapForm {
  const data = payload as MapPayload;
  return {
    content: data.content ?? "",
    objectCount: data.metadata?.objectCount == null ? "" : String(data.metadata.objectCount),
    objectTypes: data.metadata?.objectTypes?.join(", ") ?? "",
    hasLogic: data.metadata?.hasLogic ?? false,
    logicLines: data.metadata?.logicLines == null ? "" : String(data.metadata.logicLines),
    customAssets: data.metadata?.customAssets?.join(", ") ?? "",
    recommendedPlayers: data.metadata?.recommendedPlayers ?? "",
    environment: data.metadata?.environment ?? "",
  };
}

export function customLogicFromAsset(payload: CustomLogicPayload | Record<string, unknown>): CustomLogicForm {
  const data = payload as CustomLogicPayload;
  const files = Array.isArray(data.files) && data.files.length > 0
    ? data.files.map((file) => ({ namespace: file.namespace ?? "", filename: file.filename ?? "", content: file.content ?? "" }))
    : [{ namespace: "Main", filename: "main.cs", content: "" }];
  return { files, usesBuiltins: data.metadata?.usesBuiltins?.join(", ") ?? "", minGameVersion: data.metadata?.minGameVersion ?? "" };
}

export function addonFromAsset(payload: AddonPayload | Record<string, unknown>): AddonForm {
  const data = payload as AddonPayload;
  const files = Array.isArray(data.files) && data.files.length > 0
    ? data.files.map((file) => ({ filename: file.filename ?? "", content: file.content ?? "", contentType: file.contentType ?? "" }))
    : [{ filename: "addon.json", content: "", contentType: "application/json" }];
  return { files, usesBuiltins: data.metadata?.usesBuiltins?.join(", ") ?? "", provides: data.metadata?.provides?.join(", ") ?? "", minGameVersion: data.metadata?.minGameVersion ?? "" };
}

export function blankEditablePart(asset: WorkshopAsset | null): VariantTargetForm {
  return asset?.type === "skin_part" ? targetFromSkinPart(asset.payload as SkinPartPayload) : targetSlotPatch({ slot: "Hair", textureUrl: "", variants: [] }, "Hair");
}
