import { authHeaders, workshopJson } from "./http";
import type { AssetListResponse, CreatorFollowResponse, CreatorListQuery, CreatorListResponse, PublicCreator } from "./types";

export async function getPublicCreator(creatorName: string, accessToken?: string | null): Promise<PublicCreator> {
  return workshopJson<PublicCreator>(`/creators/${encodeURIComponent(creatorName)}`, { headers: authHeaders(accessToken) });
}

export async function getCreatorAssets(creatorName: string, page = 1, pageSize = 12, accessToken?: string | null): Promise<AssetListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return workshopJson<AssetListResponse>(`/creators/${encodeURIComponent(creatorName)}/assets?${params.toString()}`, { headers: authHeaders(accessToken) });
}

export async function listCreators(query: CreatorListQuery = {}, accessToken?: string | null): Promise<CreatorListResponse> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.tab?.trim()) params.set("tab", query.tab.trim());
  if (query.sort?.trim()) params.set("sort", query.sort.trim());
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  return workshopJson<CreatorListResponse>(`/creators${params.size ? `?${params.toString()}` : ""}`, { headers: authHeaders(accessToken) });
}

export async function setCreatorFollow(creatorName: string, following: boolean, accessToken: string): Promise<CreatorFollowResponse> {
  return workshopJson<CreatorFollowResponse>(`/creators/${encodeURIComponent(creatorName)}/follow`, {
    method: following ? "PUT" : "DELETE",
    headers: { authorization: `Bearer ${accessToken}` },
  });
}
