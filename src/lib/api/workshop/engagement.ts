import { WORKSHOP_CONTENT_API_BASE_URL } from "../../config";
import { authHeaders, parseJson } from "./http";
import type { EngagementWriteResponse } from "./types";

export async function setAssetLike(id: string, liked: boolean, accessToken: string): Promise<EngagementWriteResponse> {
  return writeEngagement(id, liked ? "PUT" : "DELETE", "like", accessToken);
}

export async function setAssetFavorite(id: string, favorited: boolean, accessToken: string): Promise<EngagementWriteResponse> {
  return writeEngagement(id, favorited ? "PUT" : "DELETE", "favorite", accessToken);
}

export async function trackAssetView(id: string, accessToken?: string | null): Promise<EngagementWriteResponse> {
  return writeEngagement(id, "POST", "view", accessToken);
}

export async function trackAssetDownload(id: string, accessToken?: string | null): Promise<EngagementWriteResponse> {
  return writeEngagement(id, "POST", "download", accessToken);
}

async function writeEngagement(id: string, method: "PUT" | "DELETE" | "POST", action: string, accessToken?: string | null): Promise<EngagementWriteResponse> {
  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/assets/${encodeURIComponent(id)}/${action}`, {
    method,
    headers: authHeaders(accessToken),
  });

  if (response.status === 401) {
    throw new Error("Sign in required.");
  }

  if (!response.ok) {
    throw new Error("Could not update engagement.");
  }

  return parseJson<EngagementWriteResponse>(response);
}
