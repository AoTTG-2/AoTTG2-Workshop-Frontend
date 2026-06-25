import { FileWarning, MessageCircle, ShieldAlert, UserRound } from "lucide-react";
import type { ReportStatus, TypeFilter } from "./types";

export const statusFilters: { id: ReportStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
];

export const typeFilters: TypeFilter[] = [
  { id: "all", label: "All", icon: <FileWarning className="h-4 w-4" /> },
  { id: "asset", label: "Assets", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "comment", label: "Comments", icon: <MessageCircle className="h-4 w-4" /> },
  { id: "account", label: "Accounts", icon: <UserRound className="h-4 w-4" /> },
];
