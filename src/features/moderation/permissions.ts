import type { View } from "./types";

export function firstAllowedView(reports: boolean, users: boolean, assets: boolean, comments: boolean, audits: boolean): View {
  if (reports) return "reports";
  if (users) return "users";
  if (assets) return "assets-hidden";
  if (comments) return "comments-hidden";
  if (audits) return "audits";
  return "reports";
}

export function viewAllowed(view: View, reports: boolean, users: boolean, assets: boolean, comments: boolean, audits: boolean) {
  if (view === "reports") return reports;
  if (view === "users") return users;
  if (view === "assets-hidden" || view === "assets-deleted") return assets;
  if (view === "comments-hidden") return comments;
  return audits;
}
