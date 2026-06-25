import type { WorkshopAsset } from "@/lib/api/workshop";

export type AssetKind = "skin_part" | "skin_set" | "shifter_skin_set" | "skybox_skin_set";
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
