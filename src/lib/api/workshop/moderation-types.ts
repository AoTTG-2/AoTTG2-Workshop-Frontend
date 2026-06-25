import type { AssetListResponse, WorkshopAsset } from "./types";

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

export interface ModerationUser {
  authAccountId: string;
  displayName: string;
  creatorName?: string | null;
  avatarKey?: string | null;
  roles: string[];
  lastSeenAt: string;
  assetCount: number;
  hiddenAssetCount: number;
  deletedAssetCount: number;
  commentCount: number;
  openReportCount: number;
  totalReportCount: number;
}

export interface ModerationUserListResponse {
  total: number;
  page: number;
  pageSize: number;
  users: ModerationUser[];
}

export interface ModerationUserAsset {
  id: string;
  publicId: string;
  assetSlug: string;
  status: string;
  title: string;
  assetType: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationUserComment {
  id: string;
  assetId: string;
  status: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationUserDetail {
  user: ModerationUser;
  recentReports: WorkshopReport[];
  recentAssets: ModerationUserAsset[];
  recentComments: ModerationUserComment[];
}

export interface RestrictAccountRequest {
  kind: "ban" | "suspension";
  reason: string;
  expiresAt?: string | null;
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

export type ModerationAssetListResponse = AssetListResponse;
export type ModeratedAsset = WorkshopAsset;
