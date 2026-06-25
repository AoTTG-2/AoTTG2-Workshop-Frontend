import type { WorkshopAsset } from "@/lib/api/workshop";

export function optimisticEngagement(asset: WorkshopAsset, countKey: "likeCount" | "favoriteCount", viewerKey: "liked" | "favorited", enabled: boolean): WorkshopAsset {
  const engagement = asset.engagement ?? { likeCount: 0, favoriteCount: 0, viewCount: 0, downloadCount: 0, commentCount: 0 };
  const wasEnabled = Boolean(asset.viewerEngagement?.[viewerKey]);
  const delta = enabled === wasEnabled ? 0 : enabled ? 1 : -1;
  return {
    ...asset,
    engagement: { ...engagement, [countKey]: Math.max(0, engagement[countKey] + delta) },
    viewerEngagement: { liked: Boolean(asset.viewerEngagement?.liked), favorited: Boolean(asset.viewerEngagement?.favorited), [viewerKey]: enabled },
  };
}
