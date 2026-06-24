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

export interface PublicProfile {
  accountId: string;
  displayName: string;
  description?: string | null;
  avatarKey?: string | null;
  bannerKey?: string | null;
  socials: Record<string, string>;
  createdAt: string;
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
  boots?: boolean | null;
}

export interface SkinSetItem {
  slot?: string;
  skinAssetId?: string | null;
  textureUrl?: string | null;
  variantScope?: "all" | "specific" | string | null;
  variants?: string[] | null;
  boots?: boolean | null;
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
  status: "visible" | "hidden" | "deleted" | string;
  type: WorkshopAssetType | string;
  title: string;
  descriptionMarkdown?: string | null;
  shortDescription?: string | null;
  media: WorkshopMedia[];
  payload: SkinPartPayload | SkinSetPayload | Record<string, unknown>;
  tags: string[];
  ownerAuthAccountId: string;
  authorDisplayName: string;
  authorCreatorName?: string | null;
  authorAvatarKey?: string | null;
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
  mine?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AssetListResponse {
  total: number;
  page: number;
  pageSize: number;
  assets: WorkshopAsset[];
}

export interface CreatorStats {
  assetCount: number;
  skinPartCount: number;
  skinSetCount: number;
  downloadCount: number;
  likeCount: number;
  viewCount: number;
  commentCount: number;
}

export interface PublicCreator {
  creatorName: string;
  authAccountId: string;
  displayName: string;
  profile?: PublicProfile | null;
  stats: CreatorStats;
  followerCount: number;
  viewerFollowing: boolean;
  featuredAssets: WorkshopAsset[];
  latestAssets: WorkshopAsset[];
}

export interface CreatorSummary {
  creatorName: string;
  authAccountId: string;
  displayName: string;
  profile?: PublicProfile | null;
  stats: CreatorStats;
  followerCount: number;
  viewerFollowing: boolean;
}

export interface CreatorListQuery {
  q?: string;
  tab?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatorListResponse {
  total: number;
  page: number;
  pageSize: number;
  creators: CreatorSummary[];
}

export interface CreatorFollowResponse {
  following: boolean;
  followerCount: number;
}

export interface DashboardComment {
  id: string;
  assetId: string;
  assetPublicId: string;
  assetTitle: string;
  creatorName: string;
  assetSlug: string;
  parentCommentId?: string | null;
  body: string;
  status: "visible" | "deleted" | "hidden" | string;
  authorAuthAccountId: string;
  authorDisplayName: string;
  authorCreatorName?: string | null;
  authorAvatarKey?: string | null;
  createdAt: string;
}

export interface DashboardCommentListResponse {
  total: number;
  page: number;
  pageSize: number;
  comments: DashboardComment[];
}

export interface WorkshopNotification {
  id: string;
  type: string;
  actorAuthAccountId?: string | null;
  assetId?: string | null;
  assetPublicId?: string | null;
  assetTitle?: string | null;
  creatorName?: string | null;
  assetSlug?: string | null;
  commentId?: string | null;
  metadataJson: string;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  total: number;
  unread: number;
  page: number;
  pageSize: number;
  notifications: WorkshopNotification[];
}

export interface DashboardResponse {
  stats: CreatorStats;
  unreadNotificationCount: number;
  recentAssets: WorkshopAsset[];
  recentComments: DashboardComment[];
  recentNotifications: WorkshopNotification[];
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
  textureUrlAllowlist?: string[];
  textureFileExtensions?: string[];
}

export interface WorkshopComment {
  id: string;
  assetId: string;
  parentCommentId: string | null;
  body: string;
  status: "visible" | "deleted" | "hidden";
  authorAuthAccountId: string;
  authorDisplayName: string;
  authorCreatorName?: string | null;
  authorAvatarKey?: string | null;
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

export interface WorkshopReport {
  id: string;
  targetType: "asset" | "comment" | "account" | string;
  targetId: string;
  targetOwnerAuthAccountId: string;
  reporterAuthAccountId: string;
  targetOwnerDisplayName?: string | null;
  reporterDisplayName?: string | null;
  reason: string;
  details?: string | null;
  snapshotJson: string;
  status: "open" | "resolved" | "dismissed" | string;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedByAuthAccountId?: string | null;
  resolutionNote?: string | null;
}

export interface ReportListResponse {
  total: number;
  page: number;
  pageSize: number;
  reports: WorkshopReport[];
}

export interface WorkshopAuditEvent {
  id: string;
  eventType: string;
  actorAuthAccountId?: string | null;
  targetKind: string;
  targetId: string;
  metadataJson?: string | null;
  createdAt: string;
}

export interface WorkshopAuditEventListResponse {
  total: number;
  page: number;
  pageSize: number;
  events: WorkshopAuditEvent[];
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

async function workshopJsonFrom<T>(baseUrl: string, path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init);

  if (response.status === 401 && retry) {
    const nextToken = await refreshWorkshopSession();
    if (nextToken) {
      return workshopJsonFrom<T>(baseUrl, path, {
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

async function workshopJson<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  return workshopJsonFrom<T>(WORKSHOP_CONTENT_API_BASE_URL, path, init, retry);
}

async function workshopApiJson<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  return workshopJsonFrom<T>(WORKSHOP_API_BASE_URL, path, init, retry);
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

export async function listAssets(query: AssetListQuery = {}, accessToken?: string | null): Promise<AssetListResponse> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.type) params.set("type", query.type);
  if (query.tag?.trim()) params.set("tag", query.tag.trim());
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (query.slot?.trim()) params.set("slot", query.slot.trim());
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

export async function getCreatorDashboard(accessToken: string): Promise<DashboardResponse> {
  return workshopJson<DashboardResponse>("/dashboard", { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function listDashboardComments(accessToken: string, page = 1, pageSize = 24): Promise<DashboardCommentListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return workshopJson<DashboardCommentListResponse>(`/dashboard/comments?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function listNotifications(accessToken: string, page = 1, pageSize = 24, unread?: boolean): Promise<NotificationListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (unread) params.set("unread", "true");
  return workshopJson<NotificationListResponse>(`/notifications?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function markNotificationRead(accessToken: string, id: string): Promise<{ read: boolean }> {
  return workshopJson<{ read: boolean }>(`/notifications/${encodeURIComponent(id)}/read`, { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
}

export async function markAllNotificationsRead(accessToken: string): Promise<{ read: number }> {
  return workshopJson<{ read: number }>("/notifications/read-all", { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
}

export async function getFeaturedAssets(accessToken: string): Promise<AssetListResponse> {
  return workshopJson<AssetListResponse>("/me/featured-assets", { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function setFeaturedAssets(accessToken: string, assetIds: string[]): Promise<AssetListResponse> {
  return workshopJson<AssetListResponse>("/me/featured-assets", jsonAuthInit("PUT", accessToken, { assetIds }));
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

export async function reportWorkshopComment(commentId: string, reason: string, details: string | null, accessToken: string): Promise<WorkshopReport> {
  return workshopJson<WorkshopReport>(`/comments/${encodeURIComponent(commentId)}/reports`, jsonAuthInit("POST", accessToken, { reason, details }));
}

export async function reportWorkshopAsset(assetId: string, reason: string, details: string | null, accessToken: string): Promise<WorkshopReport> {
  return workshopJson<WorkshopReport>(`/assets/${encodeURIComponent(assetId)}/reports`, jsonAuthInit("POST", accessToken, { reason, details }));
}

export async function reportWorkshopAccount(accountId: string, reason: string, details: string | null, accessToken: string): Promise<WorkshopReport> {
  return workshopJson<WorkshopReport>(`/accounts/${encodeURIComponent(accountId)}/reports`, jsonAuthInit("POST", accessToken, { reason, details }));
}

export async function listModerationReports(accessToken: string, status = "open", targetType?: string, page = 1, pageSize = 24): Promise<ReportListResponse> {
  const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
  if (targetType) params.set("targetType", targetType);
  return workshopJson<ReportListResponse>(`/moderation/reports?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function listModerationAssets(accessToken: string, status: "hidden" | "deleted", page = 1, pageSize = 24): Promise<AssetListResponse> {
  const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
  return workshopJson<AssetListResponse>(`/moderation/assets?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function resolveModerationReport(reportId: string, accessToken: string, note?: string | null): Promise<WorkshopReport> {
  return workshopJson<WorkshopReport>(`/moderation/reports/${encodeURIComponent(reportId)}/resolve`, jsonAuthInit("PUT", accessToken, { note }));
}

export async function dismissModerationReport(reportId: string, accessToken: string, note?: string | null): Promise<WorkshopReport> {
  return workshopJson<WorkshopReport>(`/moderation/reports/${encodeURIComponent(reportId)}/dismiss`, jsonAuthInit("PUT", accessToken, { note }));
}

export async function hideModerationAsset(assetId: string, accessToken: string): Promise<WorkshopAsset> {
  return workshopJson<WorkshopAsset>(`/moderation/assets/${encodeURIComponent(assetId)}/hide`, { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
}

export async function restoreModerationAsset(assetId: string, accessToken: string, assetSlug?: string | null): Promise<WorkshopAsset> {
  return workshopJson<WorkshopAsset>(`/moderation/assets/${encodeURIComponent(assetId)}/restore`, jsonAuthInit("PUT", accessToken, { assetSlug: assetSlug || null }));
}

export async function listModerationComments(accessToken: string, status: "reported" | "hidden" = "reported", page = 1, pageSize = 24): Promise<CommentListResponse> {
  const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
  return workshopJson<CommentListResponse>(`/moderation/comments?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function listModerationAuditEvents(accessToken: string, eventType = "", page = 1, pageSize = 50): Promise<WorkshopAuditEventListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (eventType.trim()) params.set("eventType", eventType.trim());
  return workshopJson<WorkshopAuditEventListResponse>(`/moderation/audit-events?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function hideModerationComment(commentId: string, accessToken: string): Promise<WorkshopComment> {
  return workshopJson<WorkshopComment>(`/moderation/comments/${encodeURIComponent(commentId)}/hide`, { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
}

export async function restoreModerationComment(commentId: string, accessToken: string): Promise<WorkshopComment> {
  return workshopJson<WorkshopComment>(`/moderation/comments/${encodeURIComponent(commentId)}/restore`, { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
}

export async function resolveModerationCommentReport(reportId: string, accessToken: string): Promise<CommentReportResponse> {
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

export async function updateAsset(accessToken: string, id: string, asset: unknown): Promise<WorkshopAsset> {
  return workshopJson<WorkshopAsset>(`/assets/${encodeURIComponent(id)}`, jsonAuthInit("PATCH", accessToken, asset));
}
