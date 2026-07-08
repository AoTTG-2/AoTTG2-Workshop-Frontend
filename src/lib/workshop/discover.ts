import { listAssets, type WorkshopAsset, type WorkshopAssetType } from "@/lib/api/workshop";
import { sortAssets, uniqueAssets } from "./asset-groups";
import { EXPERIENCE_ASSET_TYPES, SKIN_ASSET_TYPES } from "./taxonomy";

export interface DiscoverSectionData {
  assets: WorkshopAsset[];
  error: boolean;
}

export interface DiscoverData {
  featuredSkins: DiscoverSectionData;
  featuredExperiences: DiscoverSectionData;
  trendingExperiences: DiscoverSectionData;
  trendingSkins: DiscoverSectionData;
  newSkins: DiscoverSectionData;
  newExperiences: DiscoverSectionData;
}

export async function loadDiscoverData(): Promise<DiscoverData> {
  const [featuredExperiences, featuredSkins, trendingExperiences, trendingSkins, newExperiences, newSkins] = await Promise.all([
    loadTypeGroup(EXPERIENCE_ASSET_TYPES, "popular", 12),
    loadTypeGroup(SKIN_ASSET_TYPES, "popular", 12),
    loadTypeGroup(EXPERIENCE_ASSET_TYPES, "trending", 24),
    loadTypeGroup(SKIN_ASSET_TYPES, "trending", 24),
    loadTypeGroup(EXPERIENCE_ASSET_TYPES, "newest", 12),
    loadTypeGroup(SKIN_ASSET_TYPES, "newest", 12),
  ]);

  return { featuredSkins, featuredExperiences, trendingExperiences, trendingSkins, newSkins, newExperiences };
}

async function loadTypeGroup(types: readonly WorkshopAssetType[], sort: "newest" | "popular" | "trending", pageSize: number): Promise<DiscoverSectionData> {
  const results = await Promise.allSettled(types.map((type) => listAssets({ type, sort, pageSize })));
  const assets = uniqueAssets(results.flatMap((result) => result.status === "fulfilled" ? result.value.assets : []));
  return {
    assets: sortAssets(assets, sort).slice(0, pageSize),
    error: results.every((result) => result.status === "rejected"),
  };
}
