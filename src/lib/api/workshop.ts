import { WORKSHOP_API_BASE_URL, WORKSHOP_CONTENT_API_BASE_URL } from "../config";

export interface WorkshopUser {
  [key: string]: unknown;
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
  page?: number;
  pageSize?: number;
}

export interface AssetListResponse {
  total: number;
  page: number;
  pageSize: number;
  assets: WorkshopAsset[];
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

export async function createAsset(accessToken: string, asset: unknown): Promise<unknown> {
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

  return parseJson<unknown>(response);
}
