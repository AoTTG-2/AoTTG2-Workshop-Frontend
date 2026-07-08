import { listAssets, type AssetListQuery, type AssetListResponse, type WorkshopAsset, type WorkshopAssetType } from "@/lib/api/workshop";

export async function listAssetsByTypes(types: readonly WorkshopAssetType[], query: AssetListQuery): Promise<AssetListResponse> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? 24);
  const requestedType = types.includes(query.type as WorkshopAssetType) ? query.type : "";
  const queryTypes = requestedType ? [requestedType as WorkshopAssetType] : types;
  const fetchSize = Math.min(100, page * pageSize);
  const results = await Promise.all(queryTypes.map((type) => listAssets({ ...query, type, page: 1, pageSize: fetchSize })));
  const assets = uniqueAssets(results.flatMap((result) => result.assets));
  const sorted = sortAssets(assets, query.sort ?? "newest");

  return {
    total: results.reduce((sum, result) => sum + result.total, 0),
    page,
    pageSize,
    assets: sorted.slice((page - 1) * pageSize, page * pageSize),
  };
}

export function uniqueAssets(assets: WorkshopAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    if (seen.has(asset.id)) return false;
    seen.add(asset.id);
    return true;
  });
}

export function sortAssets(assets: WorkshopAsset[], sort: string) {
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
