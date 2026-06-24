import type { ProfileResponse, WorkshopUser } from "./types";

export const WORKSHOP_PERMISSIONS = {
  assetsModerate: "workshop.assets.moderate",
  commentsModerate: "workshop.comments.moderate",
  reportsResolve: "workshop.reports.resolve",
  auditRead: "workshop.audit.read",
} as const;

type PermissionSource = Pick<ProfileResponse | WorkshopUser, "permissions"> | null | undefined;

export function hasWorkshopPermission(source: PermissionSource, permission: string) {
  return source?.permissions?.includes(permission) ?? false;
}

export function canModerateAssets(source: PermissionSource) {
  return hasWorkshopPermission(source, WORKSHOP_PERMISSIONS.assetsModerate);
}

export function canModerateComments(source: PermissionSource) {
  return hasWorkshopPermission(source, WORKSHOP_PERMISSIONS.commentsModerate);
}

export function canResolveReports(source: PermissionSource) {
  return hasWorkshopPermission(source, WORKSHOP_PERMISSIONS.reportsResolve);
}

export function canReadWorkshopAudit(source: PermissionSource) {
  return hasWorkshopPermission(source, WORKSHOP_PERMISSIONS.auditRead);
}

export function canAccessWorkshopModeration(source: PermissionSource) {
  return canModerateAssets(source) || canModerateComments(source) || canResolveReports(source) || canReadWorkshopAudit(source);
}
