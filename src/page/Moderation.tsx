"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Sidebar, SidebarHeader, SidebarItem, SidebarSection, Spinner, Textarea } from "@aottg2/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Archive, Check, EyeOff, FileWarning, MessageCircle, ShieldAlert, Undo2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { canAccessWorkshopModeration, canModerateAssets, canModerateComments, canResolveReports } from "../auth/workshopPermissions";
import { getAccessToken } from "../auth/storage";
import { useAuth } from "../auth/useAuth";
import { dismissModerationReport, hideModerationAsset, hideModerationComment, listModerationReports, resolveModerationReport, restoreModerationAsset, restoreModerationComment, type WorkshopReport } from "../lib/api/workshop";
import { queryClient } from "../lib/queryClient";
import { toast } from "../lib/toast";

type StatusFilter = "open" | "resolved" | "dismissed";
type TypeFilter = "all" | "asset" | "comment" | "account";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
];

const typeFilters: { id: TypeFilter; label: string; icon: ReactNode }[] = [
  { id: "all", label: "All", icon: <FileWarning className="h-4 w-4" /> },
  { id: "asset", label: "Assets", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "comment", label: "Comments", icon: <MessageCircle className="h-4 w-4" /> },
  { id: "account", label: "Accounts", icon: <UserRound className="h-4 w-4" /> },
];

export function ModerationShell() {
  const { profile, workshopUser, isLoading } = useAuth();
  const permissionSource = workshopUser ?? profile;
  const token = getAccessToken();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [type, setType] = useState<TypeFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const canAccess = canAccessWorkshopModeration(permissionSource);
  const query = useQuery({
    queryKey: ["workshop", "moderation", "reports", status, type],
    queryFn: () => listModerationReports(token!, status, type === "all" ? undefined : type, 1, 48),
    enabled: Boolean(token && canAccess),
  });
  const reports = useMemo(() => query.data?.reports ?? [], [query.data?.reports]);
  const selected = useMemo(() => reports.find((report) => report.id === selectedId) ?? reports[0] ?? null, [reports, selectedId]);

  useEffect(() => {
    if (!selectedId && reports[0]) setSelectedId(reports[0].id);
  }, [reports, selectedId]);

  if (isLoading) return <LoadingPanel />;
  if (!canAccess) return <EmptyPanel title="Moderation unavailable" text="Workshop moderation permissions are required." />;

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] bg-background lg:min-h-[calc(100vh-4rem)]">
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:block lg:min-h-[calc(100vh-4rem)]">
        <Sidebar className="shrink-0 bg-card shadow-none lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:pl-3">
          <SidebarHeader>
            <div className="font-primary text-lg font-semibold uppercase">Moderation</div>
          </SidebarHeader>
          <SidebarSection>
            {statusFilters.map((item) => (
              <SidebarItem key={item.id} active={status === item.id} icon={<Archive className="h-4 w-4" />} onClick={() => { setStatus(item.id); setSelectedId(null); }}>
                {item.label}
              </SidebarItem>
            ))}
          </SidebarSection>
          <SidebarSection>
            {typeFilters.map((item) => (
              <SidebarItem key={item.id} active={type === item.id} icon={item.icon} onClick={() => { setType(item.id); setSelectedId(null); }}>
                {item.label}
              </SidebarItem>
            ))}
          </SidebarSection>
        </Sidebar>

        <section className="grid min-w-0 gap-4 px-4 py-6 lg:ml-64 lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] lg:px-8">
          <ReportList reports={reports} selectedId={selected?.id ?? null} loading={query.isLoading} error={query.isError} onSelect={setSelectedId} />
          <ReportDetail report={selected} note={note} onNote={setNote} onDone={() => { setNote(""); void queryClient.invalidateQueries({ queryKey: ["workshop", "moderation"] }); }} />
        </section>
      </div>
    </main>
  );
}

function ReportList({ reports, selectedId, loading, error, onSelect }: { reports: WorkshopReport[]; selectedId: string | null; loading: boolean; error: boolean; onSelect: (id: string) => void }) {
  if (loading) return <LoadingPanel />;
  if (error) return <EmptyPanel title="Reports unavailable" text="Could not load moderation reports." />;
  if (!reports.length) return <EmptyPanel title="No reports" text="Nothing matches this queue." />;
  return (
    <div className="grid content-start gap-2">
      {reports.map((report) => (
        <button key={report.id} type="button" className={`grid gap-2 border p-3 text-left transition-colors hover:border-primary hover:bg-card ${selectedId === report.id ? "border-primary bg-card" : "border-border bg-card/40"}`} onClick={() => onSelect(report.id)}>
          <div className="flex items-center justify-between gap-3">
            <span className="font-primary text-sm uppercase">{targetTitle(report)}</span>
            <Badge variant={report.status === "open" ? "secondary" : "outline"}>{report.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{report.reason}</span>
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function ReportDetail({ report, note, onNote, onDone }: { report: WorkshopReport | null; note: string; onNote: (value: string) => void; onDone: () => void }) {
  const { profile, workshopUser } = useAuth();
  const permissionSource = workshopUser ?? profile;
  const token = getAccessToken();
  const snapshot = parseSnapshot(report?.snapshotJson);
  const run = useMutation({
    mutationFn: async (action: string) => {
      if (!report || !token) return;
      if (action === "hide-asset") await hideModerationAsset(snapshot.publicId || report.targetId, token);
      if (action === "restore-asset") await restoreModerationAsset(snapshot.publicId || report.targetId, token);
      if (action === "hide-comment") await hideModerationComment(report.targetId, token);
      if (action === "restore-comment") await restoreModerationComment(report.targetId, token);
      if (action === "resolve") await resolveModerationReport(report.id, token, note);
      if (action === "dismiss") await dismissModerationReport(report.id, token, note);
    },
    onSuccess: (_, action) => {
      toast.success("Moderation updated", { description: actionLabel(action) });
      onDone();
    },
    onError: (error) => toast.error("Moderation failed", { description: error instanceof Error ? error.message : "Try again." }),
  });

  if (!report) return <EmptyPanel title="Select a report" text="Choose a report from the queue." />;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{targetTitle(report)}</CardTitle>
          <Badge variant={report.status === "open" ? "secondary" : "outline"}>{report.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 text-sm">
          <DetailRow label="Reason" value={report.reason} />
          <DetailRow label="Details" value={report.details || "None"} />
          <DetailRow label="Reporter" value={report.reporterAuthAccountId} />
          <DetailRow label="Target Owner" value={report.targetOwnerAuthAccountId} />
          <DetailRow label="Snapshot" value={snapshotSummary(snapshot)} />
        </div>
        <Textarea value={note} maxLength={1000} rows={3} placeholder="Optional moderator note" onChange={(event) => onNote(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          {report.targetType === "asset" && canModerateAssets(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => run.mutate("hide-asset")}><EyeOff className="h-4 w-4" />Hide Asset</Button> : null}
          {report.targetType === "asset" && canModerateAssets(permissionSource) ? <Button size="sm" variant="secondary" disabled={run.isPending} onClick={() => run.mutate("restore-asset")}><Undo2 className="h-4 w-4" />Restore Asset</Button> : null}
          {report.targetType === "comment" && canModerateComments(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => run.mutate("hide-comment")}><EyeOff className="h-4 w-4" />Hide Comment</Button> : null}
          {report.targetType === "comment" && canModerateComments(permissionSource) ? <Button size="sm" variant="secondary" disabled={run.isPending} onClick={() => run.mutate("restore-comment")}><Undo2 className="h-4 w-4" />Restore Comment</Button> : null}
          {canResolveReports(permissionSource) && report.status === "open" ? <Button size="sm" disabled={run.isPending} onClick={() => run.mutate("resolve")}><Check className="h-4 w-4" />Resolve</Button> : null}
          {canResolveReports(permissionSource) && report.status === "open" ? <Button size="sm" variant="ghost" disabled={run.isPending} onClick={() => run.mutate("dismiss")}>Dismiss</Button> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border pb-2 last:border-b-0">
      <span className="font-primary text-xs uppercase text-muted-foreground">{label}</span>
      <span className="break-words text-foreground">{value}</span>
    </div>
  );
}

function LoadingPanel() {
  return <div className="grid min-h-64 place-items-center border border-border bg-card/40"><Spinner variant="primary" label="Loading moderation" /></div>;
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return <div className="border border-border bg-card/40 p-6"><h1 className="font-primary text-2xl uppercase">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>;
}

function targetTitle(report: WorkshopReport) {
  const snapshot = parseSnapshot(report.snapshotJson);
  if (report.targetType === "asset") return String(snapshot.title || snapshot.assetTitle || "Asset report");
  if (report.targetType === "comment") return String(snapshot.assetTitle || "Comment report");
  if (report.targetType === "account") return String(snapshot.displayName || snapshot.creatorName || "Account report");
  return "Report";
}

function snapshotSummary(snapshot: Record<string, unknown>) {
  return String(snapshot.title || snapshot.assetTitle || snapshot.body || snapshot.displayName || snapshot.creatorName || "No snapshot");
}

function parseSnapshot(value?: string): Record<string, string> {
  try {
    return JSON.parse(value || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function actionLabel(action: unknown) {
  if (action === "resolve") return "Report resolved.";
  if (action === "dismiss") return "Report dismissed.";
  return "Content state updated.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
