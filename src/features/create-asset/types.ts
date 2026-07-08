import type { UploadedFileReference, WorkshopAsset } from "@/lib/api/workshop";

export type AssetKind = "skin_part" | "skin_set" | "shifter_skin_set" | "skybox_skin_set" | "map" | "custom_logic" | "addon";
export type ExperienceKind = "map" | "custom_logic" | "addon";
export type SkinCategory = "human" | "shifter" | "skybox";
export type WizardStep = "type" | "listing" | "data" | "description";

export interface VariantTargetForm {
  slot: string;
  source?: "url" | "asset";
  skinAssetId?: string | null;
  linkedAsset?: WorkshopAsset | null;
  textureUrl: string;
  textureUrls?: { left: string; right: string };
  variants: string[];
  hookTiling?: string;
  hookTilings?: { left: string; right: string };
  boots?: boolean;
  mirror?: boolean;
}

export interface ShifterSkinSetForm {
  target: "eren" | "annie" | "colossal";
  textureUrl: string;
}

export interface SkyboxSkinSetForm {
  front: string;
  back: string;
  left: string;
  right: string;
  up: string;
  down: string;
}

export interface MapForm {
  content: string;
  file: UploadedFileReference | null;
  objectCount: string;
  objectTypes: string;
  hasLogic: boolean;
  logicLines: string;
  customAssets: string;
  recommendedPlayers: string;
  environment: string;
}

export interface CustomLogicFileForm {
  namespace: string;
  file: UploadedFileReference | null;
}

export interface CustomLogicForm {
  files: CustomLogicFileForm[];
  usesBuiltins: string;
  minGameVersion: string;
}

export interface AddonFileForm {
  file: UploadedFileReference | null;
}

export interface AddonForm {
  files: AddonFileForm[];
  usesBuiltins: string;
  provides: string;
  minGameVersion: string;
}

export interface CommonAssetForm {
  title: string;
  assetSlug: string;
  shortDescription: string;
  descriptionMarkdown: string;
  thumbnailUrl: string;
  galleryUrls: string;
  tags: string;
}

export interface CreateAssetProps {
  mode?: "create" | "edit";
  initialAsset?: WorkshopAsset | null;
}
