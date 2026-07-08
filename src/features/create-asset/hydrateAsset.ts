import type { AddonFile, AddonPayload, CustomLogicFile, CustomLogicPayload, MapPayload, ShifterSkinSetPayload, SkinPartPayload, SkinSetPayload, SkyboxSkinSetPayload, UploadedFileReference, WorkshopAsset } from "@/lib/api/workshop";
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
  return { file: data.file ?? null };
}

export function customLogicFromAsset(payload: CustomLogicPayload | Record<string, unknown>): CustomLogicForm {
  const data = payload as CustomLogicPayload;
  return { file: data.file ?? firstLegacyFileReference(data.files) };
}

export function addonFromAsset(payload: AddonPayload | Record<string, unknown>): AddonForm {
  const data = payload as AddonPayload;
  return { file: data.file ?? firstLegacyFileReference(data.files) };
}

function firstLegacyFileReference(files: CustomLogicFile[] | AddonFile[] | undefined): UploadedFileReference | null {
  return Array.isArray(files) && files.length > 0 ? uploadedFileReferenceFromBundle(files[0]) : null;
}

function uploadedFileReferenceFromBundle(file: CustomLogicFile | AddonFile): UploadedFileReference | null {
  if (!file.uploadId) return null;
  return {
    uploadId: file.uploadId,
    key: file.key,
    objectKey: file.objectKey,
    filename: file.filename,
    sizeBytes: file.sizeBytes,
    contentType: file.contentType,
  };
}

export function blankEditablePart(asset: WorkshopAsset | null): VariantTargetForm {
  return asset?.type === "skin_part" ? targetFromSkinPart(asset.payload as SkinPartPayload) : targetSlotPatch({ slot: "Hair", textureUrl: "", variants: [] }, "Hair");
}
