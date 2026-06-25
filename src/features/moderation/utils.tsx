import { queryClient } from "@/lib/queryClient";
import type { WorkshopAuditEvent, WorkshopReport } from "@/lib/api/workshop";
import type { ReportAction } from "./types";

export function targetTitle(report: WorkshopReport) {
  const snapshot = parseSnapshot(report.snapshotJson);
  if (report.targetType === "asset") return snapshotValue(snapshot, "title") || snapshotValue(snapshot, "assetTitle") || "Asset report";
  if (report.targetType === "comment") return snapshotValue(snapshot, "assetTitle") || "Comment report";
  if (report.targetType === "account") return snapshotValue(snapshot, "displayName") || snapshotValue(snapshot, "creatorName") || "Account report";
  return "Report";
}

export function snapshotSummary(snapshot: Record<string, unknown>) {
  return snapshotValue(snapshot, "title") || snapshotValue(snapshot, "assetTitle") || snapshotValue(snapshot, "body") || snapshotValue(snapshot, "displayName") || snapshotValue(snapshot, "creatorName") || "No snapshot";
}

export function renderAuditActivity(event: WorkshopAuditEvent) {
  const metadata = parseSnapshot(event.metadataJson ?? undefined);
  const actor = event.actorAuthAccountId ?? "system";
  const target = snapshotSummary(metadata) || `${event.targetKind} ${event.targetId}`;
  const action = auditActionLabel(event.eventType);

  return (
    <span className="flex flex-wrap gap-1.5">
      <span className="font-medium">{actor}</span>
      <span className="text-muted-foreground">{action}</span>
      <span>{target}</span>
    </span>
  );
}

function auditActionLabel(eventType: string) {
  if (eventType === "workshop.asset_hidden") return "hid";
  if (eventType === "workshop.asset_restored") return "restored";
  if (eventType === "workshop.asset_deleted") return "deleted";
  if (eventType === "workshop.asset_updated") return "updated";
  if (eventType === "workshop.comment_hidden") return "hid comment on";
  if (eventType === "workshop.comment_restored") return "restored comment on";
  if (eventType === "workshop.report_resolved") return "resolved report for";
  if (eventType === "workshop.report_dismissed") return "dismissed report for";
  return eventType;
}

export function actorLabel(displayName?: string | null, fallback?: string) {
  return displayName?.trim() || fallback || "Unknown";
}

export function confirmTitle(action: ReportAction | null) {
  if (action === "delete-asset") return "Delete Asset?";
  if (action === "hide-comment") return "Hide Comment?";
  return "Hide Asset?";
}

export function confirmDescription(action: ReportAction | null) {
  if (action === "delete-asset") return "This removes the asset from public workshop listings and resolves the report.";
  if (action === "hide-comment") return "This hides the reported comment and resolves the report.";
  return "This hides the asset from public workshop listings and resolves the report.";
}

export function confirmLabel(action: ReportAction | null) {
  if (action === "delete-asset") return "DELETE";
  if (action === "hide-comment") return "HIDE";
  return "HIDE";
}

export function snapshotValue(snapshot: Record<string, unknown>, key: string) {
  const pascal = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  const value = snapshot[key] ?? snapshot[pascal];
  return typeof value === "string" ? value : "";
}

export function parseSnapshot(value?: string): Record<string, string> {
  try {
    return JSON.parse(value || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function normalizeSlug(value: string | undefined) {
  return value?.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) ?? "";
}

export function defaultExpiryLocal() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export async function invalidateModeration() {
  await queryClient.invalidateQueries({ queryKey: ["workshop", "moderation"] });
}
