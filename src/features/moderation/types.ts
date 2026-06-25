import type { ReactNode } from "react";

export type ReportStatus = "open" | "resolved" | "dismissed";
export type ReportType = "all" | "asset" | "comment" | "account";
export type View = "reports" | "users" | "assets-hidden" | "assets-deleted" | "comments-hidden" | "audits";
export type AuditViewMode = "readable" | "technical";
export type ReportAction = "hide-asset" | "delete-asset" | "hide-comment" | "ban-account" | "suspend-account";
export type RestrictionKindDraft = "ban" | "suspension";
export interface TypeFilter { id: ReportType; label: string; icon: ReactNode }
export const pageSize = 15;
export const auditPageSize = 50;
