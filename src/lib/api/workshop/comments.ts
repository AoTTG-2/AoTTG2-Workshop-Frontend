import { jsonAuthInit, workshopJson } from "./http";
import type { CommentListResponse, CommentReportResponse, WorkshopComment } from "./comments-types";
import type { WorkshopReport } from "./moderation-types";

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

export async function resolveModerationCommentReport(reportId: string, accessToken: string): Promise<CommentReportResponse> {
  return workshopJson<CommentReportResponse>(`/moderation/comment-reports/${encodeURIComponent(reportId)}/resolve`, { method: "PUT", headers: { authorization: `Bearer ${accessToken}` } });
}
