import type { VariantCatalog } from "@/lib/api/workshop";
import { bootsLabel, compatibilityVariantOptions, isCompatibilitySlot, isCostumeSlot, isGroupedHooksSlot, isGroupedSlot, isHookSlot, skinTypeLabel } from "./catalog";
import { mediaFromCommon, normalizeSlug, splitList } from "./form-utils";
import type { AddonForm, AssetKind, CommonAssetForm, CustomLogicForm, MapForm, ShifterSkinSetForm, SkyboxSkinSetForm, VariantTargetForm } from "./types";
import { shifterTargets, skyboxFaces } from "./constants";
import { commonSchema, itemSchema, skinPartSchema, validatePublishMedia, validateTextureUrl } from "./validation";

function hookTilingSlot(slot: string) {
  return slot === "HookL" ? "HookLTiling" : "HookRTiling";
}

function hookTilingPayload(value: { slot: string; hookTiling?: string }) {
  if (!isHookSlot(value.slot)) return {};
  const tiling = Number(value.hookTiling || "1");
  if (!Number.isFinite(tiling) || tiling <= 0) {
    throw new Error(`${skinTypeLabel(value.slot)} tiling must be greater than 0`);
  }
  return { tilingSlot: hookTilingSlot(value.slot), tiling };
}

function bootsPayload(value: { slot: string; boots?: boolean }) {
  return isCostumeSlot(value.slot) ? { boots: value.boots ?? true } : {};
}

function groupedTexturePayload(value: { slot: string; textureUrls?: { left: string; right: string }; hookTilings?: { left: string; right: string }; mirror?: boolean }, catalog: VariantCatalog) {
  const left = value.textureUrls?.left.trim() ?? "";
  const right = value.textureUrls?.right.trim() ?? "";
  if (!left && !right) throw new Error(`Add a left or right texture URL for ${skinTypeLabel(value.slot)}`);
  if (left) validateTextureUrl(left, catalog);
  if (right) validateTextureUrl(right, catalog);
  const payload: Record<string, unknown> = { slot: value.slot, textureUrls: { left: left || null, right: right || null }, mirror: value.mirror ?? false, variantScope: "all" };
  if (isGroupedHooksSlot(value.slot)) {
    const hookTilings = value.hookTilings ?? { left: "1", right: "1" };
    const leftTiling = Number(hookTilings.left || "1");
    const rightTiling = Number(hookTilings.right || "1");
    if (!Number.isFinite(leftTiling) || leftTiling <= 0 || !Number.isFinite(rightTiling) || rightTiling <= 0) throw new Error("Hook tiling must be greater than 0");
    payload.hookTilings = { left: leftTiling, right: rightTiling };
  }
  return payload;
}

export function prepareTarget(value: VariantTargetForm, catalog: VariantCatalog) {
  const data = itemSchema.parse(value);
  if (isGroupedSlot(data.slot)) return groupedTexturePayload(data, catalog);
  if (!data.textureUrl) throw new Error("Texture URL is required");
  validateTextureUrl(data.textureUrl, catalog);
  if (!isCompatibilitySlot(data.slot, catalog)) return { slot: data.slot, textureUrl: data.textureUrl, variantScope: "all" as const, ...hookTilingPayload(data) };

  const allowed = new Set(compatibilityVariantOptions(data.slot, catalog).map((option) => option.id));
  const variants = data.variants.filter((variant) => allowed.has(variant));
  if (variants.length === 0) throw new Error(`Choose at least one compatible model for ${skinTypeLabel(data.slot)}`);
  return { slot: data.slot, textureUrl: data.textureUrl, variantScope: "specific" as const, variants, ...bootsPayload(data) };
}

export function prepareSetItem(value: VariantTargetForm, catalog: VariantCatalog) {
  if (value.source === "asset" || value.skinAssetId) {
    if (!value.slot) throw new Error("Slot is required");
    if (!value.skinAssetId) throw new Error(`Choose a ${skinTypeLabel(value.slot)} asset`);
    return { slot: value.slot, skinAssetId: value.skinAssetId, textureUrl: null, variantScope: null, variants: null };
  }
  return prepareTarget(value, catalog);
}

export function prepareShifterSkinSet(value: ShifterSkinSetForm, catalog: VariantCatalog) {
  const payload = { category: "shifter" as const, target: value.target, textureUrl: value.textureUrl.trim() };
  if (!shifterTargets.some((target) => target.key === payload.target)) throw new Error("target is required");
  if (!payload.textureUrl) throw new Error("Texture URL is required");
  validateTextureUrl(payload.textureUrl, catalog);
  return payload;
}

export function prepareSkyboxSkinSet(value: SkyboxSkinSetForm, catalog: VariantCatalog) {
  const payload = { category: "skybox" as const, front: value.front.trim(), back: value.back.trim(), left: value.left.trim(), right: value.right.trim(), up: value.up.trim(), down: value.down.trim() };
  skyboxFaces.forEach((face) => {
    const url = payload[face.key];
    if (!url) throw new Error(`Set ${face.label} texture`);
    validateTextureUrl(url, catalog);
  });
  return payload;
}

export function prepareMap(value: MapForm, common: { galleryUrls: string }) {
  if (!isCompleteUploadedFileReference(value.file)) throw new Error("Upload a map file before publishing");
  const objectCount = numberOrZero(value.objectCount, "Object count");
  const logicLines = value.logicLines.trim() ? numberOrZero(value.logicLines, "Logic lines") : null;
  return {
    file: value.file,
    screenshots: splitList(common.galleryUrls),
    metadata: {
      objectCount,
      objectTypes: splitList(value.objectTypes),
      hasLogic: value.hasLogic,
      logicLines,
      customAssets: splitList(value.customAssets),
      recommendedPlayers: value.recommendedPlayers.trim() || null,
      environment: value.environment.trim() || null,
    },
  };
}

export function prepareCustomLogic(value: CustomLogicForm) {
  if (value.files.length === 0) throw new Error("Add at least one logic file");
  if (value.files.length > 5) throw new Error("Custom logic supports up to 5 files");
  const files = value.files.map((file, index) => {
    if (!isCompleteUploadedFileReference(file.file)) throw new Error(`Upload logic file ${index + 1} before publishing`);
    return { namespace: file.namespace.trim(), ...uploadedFilePayload(file.file) };
  });
  return {
    files,
    metadata: {
      hasMainClass: false,
      hasComponents: false,
      totalLines: 0,
      usesBuiltins: splitList(value.usesBuiltins),
      minGameVersion: value.minGameVersion.trim() || null,
    },
  };
}

export function prepareAddon(value: AddonForm) {
  if (value.files.length === 0) throw new Error("Add at least one addon file");
  if (value.files.length > 5) throw new Error("Addons support up to 5 files");
  const files = value.files.map((file, index) => {
    if (!isCompleteUploadedFileReference(file.file)) throw new Error(`Upload addon file ${index + 1} before publishing`);
    return uploadedFilePayload(file.file);
  });
  return {
    files,
    metadata: {
      minGameVersion: value.minGameVersion.trim() || null,
      usesBuiltins: splitList(value.usesBuiltins),
      provides: splitList(value.provides),
    },
  };
}

export function buildAsset(kind: AssetKind, common: CommonAssetForm, part: VariantTargetForm, items: VariantTargetForm[], shifter: ShifterSkinSetForm, skybox: SkyboxSkinSetForm, map: MapForm, customLogic: CustomLogicForm, addon: AddonForm, catalog: VariantCatalog) {
  if (kind === "skin_part") {
    const data = skinPartSchema.parse({ ...common, ...part });
    validatePublishMedia(data);
    const assetSlug = normalizeSlug(data.assetSlug);
    return { type: "skin_part", title: data.title, ...(assetSlug ? { assetSlug } : {}), descriptionMarkdown: data.descriptionMarkdown, shortDescription: data.shortDescription, media: mediaFromCommon(data), payload: { category: "human", ...prepareTarget(data, catalog) }, tags: splitList(data.tags) };
  }

  const data = commonSchema.parse(common);
  validatePublishMedia(data);
  const assetSlug = normalizeSlug(data.assetSlug);
  if (kind === "shifter_skin_set") return { type: "shifter_skin_set", title: data.title, ...(assetSlug ? { assetSlug } : {}), descriptionMarkdown: data.descriptionMarkdown, shortDescription: data.shortDescription, media: mediaFromCommon(data), payload: prepareShifterSkinSet(shifter, catalog), tags: splitList(data.tags) };
  if (kind === "skybox_skin_set") return { type: "skybox_skin_set", title: data.title, ...(assetSlug ? { assetSlug } : {}), descriptionMarkdown: data.descriptionMarkdown, shortDescription: data.shortDescription, media: mediaFromCommon(data), payload: prepareSkyboxSkinSet(skybox, catalog), tags: splitList(data.tags) };
  if (kind === "map") return { type: "map", title: data.title, ...(assetSlug ? { assetSlug } : {}), descriptionMarkdown: data.descriptionMarkdown, shortDescription: data.shortDescription, media: mediaFromCommon(data), payload: prepareMap(map, data), tags: splitList(data.tags) };
  if (kind === "custom_logic") return { type: "custom_logic", title: data.title, ...(assetSlug ? { assetSlug } : {}), descriptionMarkdown: data.descriptionMarkdown, shortDescription: data.shortDescription, media: mediaFromCommon(data), payload: prepareCustomLogic(customLogic), tags: splitList(data.tags) };
  if (kind === "addon") return { type: "addon", title: data.title, ...(assetSlug ? { assetSlug } : {}), descriptionMarkdown: data.descriptionMarkdown, shortDescription: data.shortDescription, media: mediaFromCommon(data), payload: prepareAddon(addon), tags: splitList(data.tags) };
  if (items.length === 0) throw new Error("Add at least one set item");
  return { type: "skin_set", title: data.title, ...(assetSlug ? { assetSlug } : {}), descriptionMarkdown: data.descriptionMarkdown, shortDescription: data.shortDescription, media: mediaFromCommon(data), payload: { category: "human", items: items.map((item) => prepareSetItem(item, catalog)) }, tags: splitList(data.tags) };
}

export function updatePayloadFromAssetForm(asset: unknown) {
  const patch = { ...(asset as Record<string, unknown>) };
  delete patch.type;
  delete patch.assetSlug;
  return patch;
}

export function reviewDataSummary(kind: AssetKind, part: VariantTargetForm, items: VariantTargetForm[], shifter: ShifterSkinSetForm, skybox: SkyboxSkinSetForm, map: MapForm, customLogic: CustomLogicForm, addon: AddonForm) {
  if (kind === "skin_part") return `${skinTypeLabel(part.slot)}${part.variants.length ? ` - ${part.variants.length} model${part.variants.length === 1 ? "" : "s"}` : ""}${bootsLabel(part) ? ` - ${bootsLabel(part)}` : ""}`;
  if (kind === "skin_set") return `${items.length} set item${items.length === 1 ? "" : "s"}`;
  if (kind === "shifter_skin_set") return `${shifterTargets.find((item) => item.key === shifter.target)?.label ?? "Shifter"} Shifter`;
  if (kind === "map") return map.file?.filename ? map.file.filename : "No map file";
  if (kind === "custom_logic") return uploadSummary(customLogic.files.map((file) => file.file), "logic file", "logic files");
  if (kind === "addon") return uploadSummary(addon.files.map((file) => file.file), "addon file", "addon files");
  const count = skyboxFaces.filter((face) => skybox[face.key].trim()).length;
  return `${count} skybox face${count === 1 ? "" : "s"}`;
}

function uploadedFilePayload(file: NonNullable<MapForm["file"]>) {
  return {
    uploadId: file.uploadId,
    key: file.key,
    objectKey: file.objectKey,
    filename: file.filename,
    sizeBytes: file.sizeBytes,
    contentType: file.contentType,
  };
}

function uploadSummary(files: Array<MapForm["file"]>, singular: string, plural: string) {
  const uploaded = files.filter((file) => file?.filename).length;
  return `${uploaded}/${files.length} ${files.length === 1 ? singular : plural}`;
}

function isCompleteUploadedFileReference(file: MapForm["file"]): file is NonNullable<MapForm["file"]> {
  return Boolean(file?.uploadId && (file.key || file.objectKey) && file.filename && typeof file.sizeBytes === "number" && file.contentType);
}

function numberOrZero(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be zero or greater`);
  return Math.floor(number);
}
