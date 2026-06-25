import { WORKSHOP_CONTENT_API_BASE_URL } from "../../config";
import { authHeaders, jsonAuthInit, parseJson, workshopApiJson, workshopJson, type ApiError } from "./http";
import type { AssetListQuery, AssetListResponse, WorkshopAsset } from "./types";

export function assetPath(asset: Pick<WorkshopAsset, "creatorName" | "assetSlug" | "publicId">) {
  return asset.creatorName && asset.assetSlug
    ? `/${encodeURIComponent(asset.creatorName)}/${encodeURIComponent(asset.assetSlug)}`
    : `/library/${encodeURIComponent(asset.publicId)}`;
}

export async function listAssets(query: AssetListQuery = {}, accessToken?: string | null): Promise<AssetListResponse> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.type) params.set("type", query.type);
  if (query.tag?.trim()) params.set("tag", query.tag.trim());
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (query.slot?.trim()) params.set("slot", query.slot.trim());
  if (query.target?.trim()) params.set("target", query.target.trim());
  if (query.sort?.trim()) params.set("sort", query.sort.trim());
  if (query.mine) params.set("mine", "true");
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/assets${params.size ? `?${params.toString()}` : ""}`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Failed to load assets");
  }

  return parseJson<AssetListResponse>(response);
}

export async function listFavoriteAssets(accessToken: string, page = 1, pageSize = 24): Promise<AssetListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return workshopApiJson<AssetListResponse>(`/me/favorites?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function listAssetUsedBy(id: string, accessToken?: string | null): Promise<AssetListResponse> {
  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/assets/${encodeURIComponent(id)}/used-by`, {
    headers: authHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error("Failed to load linked sets");
  }

  return parseJson<AssetListResponse>(response);
}

export async function getAsset(id: string, accessToken?: string | null): Promise<WorkshopAsset> {
  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/assets/${encodeURIComponent(id)}`, {
    headers: authHeaders(accessToken),
  });

  if (response.status === 404) {
    throw new Error("Asset not found");
  }

  if (!response.ok) {
    throw new Error("Failed to load asset");
  }

  return parseJson<WorkshopAsset>(response);
}

export async function getAssetBySeoPath(creatorName: string, assetSlug: string, accessToken?: string | null): Promise<WorkshopAsset> {
  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/assets/${encodeURIComponent(creatorName)}/${encodeURIComponent(assetSlug)}`, {
    headers: authHeaders(accessToken),
  });

  if (response.status === 404) {
    throw new Error("Asset not found");
  }

  if (!response.ok) {
    throw new Error("Failed to load asset");
  }

  return parseJson<WorkshopAsset>(response);
}

export async function deleteWorkshopAsset(id: string, accessToken: string): Promise<{ deleted: boolean }> {
  return workshopJson<{ deleted: boolean }>(`/assets/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${accessToken}` },
  });
}

export async function createAsset(accessToken: string, asset: unknown): Promise<WorkshopAsset> {
  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/assets`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(asset),
  });

  if (response.status === 401) {
    throw new Error("Your session expired. Sign in again before creating an asset.");
  }

  if (!response.ok) {
    const data = await parseJson<ApiError>(response);
    const validationMessage = Object.values(data.errors ?? {}).flat()[0];
    const serverMessage = data.error || data.detail || validationMessage || data.title;
    const fallbackMessage =
      response.status === 404
        ? "Workshop asset creation endpoint was not found. Check the frontend API URL."
        : response.status >= 500
          ? "Workshop server error. Try again after the server recovers."
          : "Workshop rejected this asset. Check the fields and try again.";

    throw new Error(serverMessage || fallbackMessage);
  }

  return parseJson<WorkshopAsset>(response);
}

export async function updateAsset(accessToken: string, id: string, asset: unknown): Promise<WorkshopAsset> {
  return workshopJson<WorkshopAsset>(`/assets/${encodeURIComponent(id)}`, jsonAuthInit("PATCH", accessToken, asset));
}
