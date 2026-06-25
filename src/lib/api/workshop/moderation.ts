import { AUTH_API_BASE_URL } from "../../config";
import { jsonAuthInit, workshopJson, workshopJsonFrom } from "./http";
import type { CommentListResponse, WorkshopComment } from "./comments-types";
import type {
  ModerationUserDetail,
  ModerationUserListResponse,
  ReportListResponse,
  RestrictAccountRequest,
  WorkshopAuditEventListResponse,
  WorkshopReport,
} from "./moderation-types";
import type { AssetListResponse, WorkshopAsset } from "./types";

export async function listModerationReports(accessToken: string, status = "open", targetType?: string, page = 1, pageSize = 24): Promise<ReportListResponse> {
  const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
  if (targetType) params.set("targetType", targetType);
  return workshopJson<ReportListResponse>(`/moderation/reports?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function listModerationUsers(accessToken: string, search = "", reportedOnly = true, page = 1, pageSize = 24): Promise<ModerationUserListResponse> {
  const params = new URLSearchParams({ reportedOnly: String(reportedOnly), page: String(page), pageSize: String(pageSize) });
  if (search.trim()) params.set("search", search.trim());
  return workshopJson<ModerationUserListResponse>(`/moderation/users?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function getModerationUser(accessToken: string, accountId: string): Promise<ModerationUserDetail> {
  return workshopJson<ModerationUserDetail>(`/moderation/users/${encodeURIComponent(accountId)}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function listModerationAssets(accessToken: string, status: "hidden" | "deleted", page = 1, pageSize = 24): Promise<AssetListResponse> {
  const params = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
  return workshopJson<AssetListResponse>(`/moderation/assets?${params.toString()}`, { headers: { authorization: `Bearer ${accessToken}` } });
}

export async function restrictAuthAccount(accessToken: string, accountId: string, body: RestrictAccountRequest): Promise<unknown> {
  return workshopJsonFrom<unknown>(
    AUTH_API_BASE_URL,
    `/admin/accounts/${encodeURIComponent(accountId)}/restriction`,
    jsonAuthInit("PUT", accessToken, body),
  );
}

export async function liftAuthAccountRestriction(accessToken: string, accountId: string): Promise<unknown> {
  return workshopJsonFrom<unknown>(
    AUTH_API_BASE_URL,
    `/admin/accounts/${encodeURIComponent(accountId)}/restriction`,
    { method: "DELETE", headers: { authorization: `Bearer ${accessToken}` } },
  );
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
