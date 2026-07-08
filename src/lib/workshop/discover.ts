import { listAssets, type WorkshopAsset, type WorkshopAssetType } from "@/lib/api/workshop";
import { EXPERIENCE_ASSET_TYPES, SKIN_ASSET_TYPES } from "./taxonomy";

export interface DiscoverSectionData {
  assets: WorkshopAsset[];
  error: boolean;
}

export interface DiscoverData {
  featuredSkins: DiscoverSectionData;
  featuredExperiences: DiscoverSectionData;
  trendingExperiences: DiscoverSectionData;
  newUploads: DiscoverSectionData;
  newSkins: DiscoverSectionData;
  newExperiences: DiscoverSectionData;
}

export async function loadDiscoverData(): Promise<DiscoverData> {
  const [featuredSkins, featuredExperiences, trendingExperiences, newUploads, newSkins, newExperiences] = await Promise.all([
    loadTypeGroup(SKIN_ASSET_TYPES, "popular", 12),
    loadTypeGroup(EXPERIENCE_ASSET_TYPES, "popular", 12),
    loadTypeGroup(EXPERIENCE_ASSET_TYPES, "trending", 24),
    loadSingle({ sort: "newest", pageSize: 24 }),
    loadTypeGroup(SKIN_ASSET_TYPES, "newest", 12),
    loadTypeGroup(EXPERIENCE_ASSET_TYPES, "newest", 12),
  ]);

  return { featuredSkins, featuredExperiences, trendingExperiences, newUploads, newSkins, newExperiences };
}

async function loadSingle(query: { sort: "newest" | "popular" | "trending"; pageSize: number }): Promise<DiscoverSectionData> {
  try {
    const data = await listAssets(query);
    return { assets: data.assets, error: false };
  } catch {
    return { assets: [], error: true };
  }
}

async function loadTypeGroup(types: readonly WorkshopAssetType[], sort: "newest" | "popular" | "trending", pageSize: number): Promise<DiscoverSectionData> {
  const results = await Promise.allSettled(types.map((type) => listAssets({ type, sort, pageSize })));
  const assets = uniqueAssets(results.flatMap((result) => result.status === "fulfilled" ? result.value.assets : []));
  return {
    assets: sortAssets(assets, sort).slice(0, pageSize),
    error: results.every((result) => result.status === "rejected"),
  };
}

function uniqueAssets(assets: WorkshopAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    if (seen.has(asset.id)) return false;
    seen.add(asset.id);
    return true;
  });
}

function sortAssets(assets: WorkshopAsset[], sort: "newest" | "popular" | "trending") {
  if (sort === "newest") {
    return [...assets].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }

  return [...assets].sort((left, right) => {
    const score = popularScore(right) - popularScore(left);
    return score || Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}

function popularScore(asset: WorkshopAsset) {
  const engagement = asset.engagement;
  return Math.log(1 + (engagement?.downloadCount ?? 0) * 6) +
    Math.log(1 + (engagement?.favoriteCount ?? 0) * 3) +
    Math.log(1 + (engagement?.likeCount ?? 0)) +
    Math.log(1 + (engagement?.viewCount ?? 0) * 0.05);
}
