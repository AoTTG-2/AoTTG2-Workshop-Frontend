import { jsonAuthInit, workshopJson } from "./http";
import type {
  AssetListResponse,
  DashboardCommentListResponse,
  DashboardResponse,
  NotificationListResponse,
} from "./types";

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
