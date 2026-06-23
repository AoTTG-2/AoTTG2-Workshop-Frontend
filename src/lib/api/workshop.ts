import { clearTokens, getRefreshToken, setTokens } from "../../auth/storage";
import type { AuthResponse } from "../../auth/types";
import { AUTH_API_BASE_URL, WORKSHOP_API_BASE_URL, WORKSHOP_CONTENT_API_BASE_URL } from "../config";

export interface WorkshopUser {
  authAccountId: string;
  displayName: string;
  creatorName: string | null;
  photonUserId?: string | null;
  roles: string[];
  permissions?: string[];
  lastSeenAt: string;
}

export type WorkshopAssetType = "skin_part" | "skin_set";

export interface WorkshopMedia {
  kind: "thumbnail" | "gallery" | string;
  url: string;
  description?: string | null;
}

export interface SkinPartPayload {
  category?: string;
  slot?: string;
  textureUrl?: string;
  variantScope?: "all" | "specific" | string;
  variants?: string[];
}

export interface SkinSetItem {
  slot?: string;
  skinAssetId?: string | null;
  textureUrl?: string | null;
  variantScope?: "all" | "specific" | string | null;
  variants?: string[] | null;
}

export interface SkinSetPayload {
  category?: string;
  items?: SkinSetItem[];
}

export interface WorkshopAsset {
  id: string;
  publicId: string;
  creatorName: string;
  assetSlug: string;
  type: WorkshopAssetType | string;
  title: string;
  descriptionMarkdown?: string | null;
  shortDescription?: string | null;
  media: WorkshopMedia[];
  payload: SkinPartPayload | SkinSetPayload | Record<string, unknown>;
  tags: string[];
  ownerAuthAccountId: string;
  authorDisplayName: string;
  createdAt: string;
  updatedAt: string;
  engagement?: AssetEngagement;
  viewerEngagement?: ViewerEngagement | null;
}

export interface AssetEngagement {
  likeCount: number;
  favoriteCount: number;
  viewCount: number;
  downloadCount: number;
  commentCount: number;
}

export interface ViewerEngagement {
  liked: boolean;
  favorited: boolean;
}

export interface EngagementWriteResponse {
  engagement: AssetEngagement;
  viewerEngagement?: ViewerEngagement | null;
  counted: boolean;
}

export interface AssetListQuery {
  q?: string;
  type?: string;
  tag?: string;
  category?: string;
  slot?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface AssetListResponse {
  total: number;
  page: number;
  pageSize: number;
  assets: WorkshopAsset[];
}

export interface WorkshopVariantOption {
  id: string;
  label: string;
  previewUrl?: string | null;
}

export interface VariantCatalog {
  hairMale: string[];
  hairFemale: string[];
  costumeMale: string[];
  costumeFemale: string[];
  hat: string[];
  head: string[];
  back: string[];
  humanSkinParts: string[];
  humanCompatibilitySlots?: string[];
  humanCompatibilityVariants?: Record<string, WorkshopVariantOption[]>;
}

export interface WorkshopComment {
  id: string;
  assetId: string;
  parentCommentId: string | null;
  body: string;
  status: "visible" | "deleted" | "hidden";
  authorAuthAccountId: string;
  authorDisplayName: string;
  createdAt: string;
  updatedAt: string;
  replies: WorkshopComment[];
}

export interface CommentListResponse {
  total: number;
  page: number;
  pageSize: number;
  comments: WorkshopComment[];
}

export interface CommentReportResponse {
  id: string;
  commentId: string;
  reporterAuthAccountId: string;
  reason: string;
  createdAt: string;
  resolvedAt?: string | null;
}

interface ApiError {
  error?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

function authHeaders(accessToken?: string | null) {
  return accessToken ? { authorization: `Bearer ${accessToken}` } : undefined;
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

async function refreshWorkshopSession(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${AUTH_API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = await parseJson<AuthResponse>(response);
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function workshopJson<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}${path}`, init);

  if (response.status === 401 && retry) {
    const nextToken = await refreshWorkshopSession();
    if (nextToken) {
      return workshopJson<T>(path, {
        ...init,
        headers: { ...(init.headers as Record<string, string> | undefined), authorization: `Bearer ${nextToken}` },
      }, false);
    }
  }

  if (response.status === 401) {
    clearTokens();
    throw new Error("Sign in required.");
  }

  if (!response.ok) {
    const data = await parseJson<ApiError>(response);
    const validationMessage = Object.values(data.errors ?? {}).flat()[0];
    throw new Error(data.error || data.detail || validationMessage || data.title || fallbackWorkshopError(response.status));
  }

  return parseJson<T>(response);
}

function jsonAuthInit(method: string, accessToken: string, body?: unknown): RequestInit {
  return {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

function fallbackWorkshopError(status: number) {
  if (status === 400) return "Check the fields and try again.";
  if (status === 404) return "This item is unavailable.";
  if (status === 429) return "Slow down and try again in a moment.";
  if (status >= 500) return "Workshop server error. Try again later.";
  return "Workshop request failed.";
}

export function assetPath(asset: Pick<WorkshopAsset, "creatorName" | "assetSlug" | "publicId">) {
  return asset.creatorName && asset.assetSlug
    ? `/${encodeURIComponent(asset.creatorName)}/${encodeURIComponent(asset.assetSlug)}`
    : `/library/${encodeURIComponent(asset.publicId)}`;
}

export async function getWorkshopMe(accessToken: string): Promise<WorkshopUser | null> {
  const response = await fetch(`${WORKSHOP_API_BASE_URL}/me`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load Workshop user");
  }

  return parseJson<WorkshopUser>(response);
}

export async function setCreatorName(accessToken: string, creatorName: string): Promise<WorkshopUser> {
  const response = await fetch(`${WORKSHOP_API_BASE_URL}/me/creator-name`, jsonAuthInit("PUT", accessToken, { creatorName }));

  if (response.status === 401) {
    clearTokens();
    throw new Error("Sign in required.");
  }

  if (!response.ok) {
    const data = await parseJson<ApiError>(response);
    const validationMessage = Object.values(data.errors ?? {}).flat()[0];
    throw new Error(data.error || data.detail || validationMessage || data.title || fallbackWorkshopError(response.status));
  }

  return parseJson<WorkshopUser>(response);
}

export async function getVariantCatalog(): Promise<VariantCatalog> {
  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/variants`);

  if (!response.ok) {
    throw new Error("Failed to load variants");
  }

  return parseJson<VariantCatalog>(response);
}

export async function listAssets(query: AssetListQuery = {}): Promise<AssetListResponse> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.type) params.set("type", query.type);
  if (query.tag?.trim()) params.set("tag", query.tag.trim());
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (query.slot?.trim()) params.set("slot", query.slot.trim());
  if (query.sort?.trim()) params.set("sort", query.sort.trim());
  if (query.page && query.page > 1) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/assets${params.size ? `?${params.toString()}` : ""}`);

  if (!response.ok) {
    throw new Error("Failed to load assets");
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

export async function listAssetComments(assetId: string, page = 1, pageSize = 24): Promise<CommentListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return workshopJson<CommentListResponse>(`/assets/${encodeURIComponent(assetId)}/comments?${params.toString()}`);
}

export async function createAssetComment(assetId: string, body: string, accessToken: string): Promise<WorkshopComment> {
  return workshopJson<WorkshopComment>(`/assets/${encodeURIComponent(assetId)}/comments`, jsonAuthInit("POST", accessToken, { body }));
}

export async function replyToAssetComment(assetId: string, commentId: string, body: string, accessToken: string): Promise<WorkshopComment> {
  return workshopJson<WorkshopComment>(`/assets/${encodeURIComponent(assetId)}/comments/${encodeURIComponent(commentId)}/replies`, jsonAuthInit("POST", accessToken, { body }));
}

export async function deleteWorkshopComment(commentId: string, accessToken: string): Promise<{ deleted: boolean }> {
  return workshopJson<{ deleted: boolean }>(`/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${accessToken}` },
  });
}

export async function reportWorkshopComment(commentId: string, reason: string, accessToken: string): Promise<CommentReportResponse> {
  return workshopJson<CommentReportResponse>(`/comments/${encodeURIComponent(commentId)}/reports`, jsonAuthInit("POST", accessToken, { reason }));
}

export async function listModerationComments(accessToken: string, status: "reported" | "hidden" = "reported", page = 1, pageSize = 24): Promise<CommentListResponse> {
  const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
  return workshopJson<CommentListResponse>(`/moderation/comments?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function hideModerationComment(commentId: string, accessToken: string): Promise<WorkshopComment> {
  return workshopJson<WorkshopComment>(`/moderation/comments/${encodeURIComponent(commentId)}/hide`, { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
}

export async function restoreModerationComment(commentId: string, accessToken: string): Promise<WorkshopComment> {
  return workshopJson<WorkshopComment>(`/moderation/comments/${encodeURIComponent(commentId)}/restore`, { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
}

export async function resolveModerationReport(reportId: string, accessToken: string): Promise<CommentReportResponse> {
  return workshopJson<CommentReportResponse>(`/moderation/comment-reports/${encodeURIComponent(reportId)}/resolve`, { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
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
