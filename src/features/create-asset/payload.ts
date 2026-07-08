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
  const content = value.content.trim();
  if (!content) throw new Error("Map content is required");
  const objectCount = numberOrZero(value.objectCount, "Object count");
  const logicLines = value.logicLines.trim() ? numberOrZero(value.logicLines, "Logic lines") : null;
  return {
    content,
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
  const files = value.files.map((file) => ({ namespace: file.namespace.trim(), filename: file.filename.trim(), content: file.content.trimEnd() }));
  if (files.length === 0) throw new Error("Add at least one logic file");
  files.forEach((file) => {
    if (!file.filename) throw new Error("Logic filename is required");
    if (!file.content.trim()) throw new Error(`${file.filename || "Logic file"} content is required`);
  });
  const totalLines = files.reduce((sum, file) => sum + countLines(file.content), 0);
  return {
    files,
    metadata: {
      hasMainClass: files.some((file) => /\bclass\s+Main\b/i.test(file.content) || /\bMain\s*\(/i.test(file.content)),
      hasComponents: files.some((file) => /\bcomponent\b/i.test(file.content)),
      totalLines,
      usesBuiltins: splitList(value.usesBuiltins),
      minGameVersion: value.minGameVersion.trim() || null,
    },
  };
}

export function prepareAddon(value: AddonForm) {
  const files = value.files.map((file) => ({ filename: file.filename.trim(), content: file.content.trimEnd(), contentType: file.contentType.trim() || null }));
  if (files.length === 0) throw new Error("Add at least one addon file");
  files.forEach((file) => {
    if (!file.filename) throw new Error("Addon filename is required");
    if (!file.content.trim()) throw new Error(`${file.filename || "Addon file"} content is required`);
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
  if (kind === "map") return map.content.trim() ? `${countLines(map.content)} map line${countLines(map.content) === 1 ? "" : "s"}` : "No map content";
  if (kind === "custom_logic") return `${customLogic.files.length} logic file${customLogic.files.length === 1 ? "" : "s"}`;
  if (kind === "addon") return `${addon.files.length} addon file${addon.files.length === 1 ? "" : "s"}`;
  const count = skyboxFaces.filter((face) => skybox[face.key].trim()).length;
  return `${count} skybox face${count === 1 ? "" : "s"}`;
}

function countLines(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\r?\n/).length : 0;
}

function numberOrZero(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} must be zero or greater`);
  return Math.floor(number);
}
