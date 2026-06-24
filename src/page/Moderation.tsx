"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState, FilterBar, Input, Label, SearchInput, Sidebar, SidebarHeader, SidebarItem, SidebarSection, Spinner, Textarea } from "@aottg2/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Archive, EyeOff, FileText, FileWarning, MessageCircle, RotateCcw, ShieldAlert, Trash2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { canAccessWorkshopModeration, canModerateAssets, canModerateComments, canReadWorkshopAudit, canResolveReports } from "../auth/workshopPermissions";
import { getAccessToken } from "../auth/storage";
import { useAuth } from "../auth/useAuth";
import { deleteWorkshopAsset, dismissModerationReport, hideModerationAsset, hideModerationComment, listModerationAssets, listModerationAuditEvents, listModerationComments, listModerationReports, resolveModerationReport, restoreModerationAsset, restoreModerationComment, type WorkshopAsset, type WorkshopAuditEvent, type WorkshopComment, type WorkshopReport } from "../lib/api/workshop";
import { queryClient } from "../lib/queryClient";
import { toast } from "../lib/toast";

type ReportStatus = "open" | "resolved" | "dismissed";
type ReportType = "all" | "asset" | "comment" | "account";
type View = "reports" | "assets-hidden" | "assets-deleted" | "comments-hidden" | "audits";
type AuditViewMode = "readable" | "technical";
type ReportAction = "hide-asset" | "delete-asset" | "hide-comment";
const pageSize = 15;
const auditPageSize = 50;

const statusFilters: { id: ReportStatus; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
];

const typeFilters: { id: ReportType; label: string; icon: ReactNode }[] = [
  { id: "all", label: "All", icon: <FileWarning className="h-4 w-4" /> },
  { id: "asset", label: "Assets", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "comment", label: "Comments", icon: <MessageCircle className="h-4 w-4" /> },
  { id: "account", label: "Accounts", icon: <UserRound className="h-4 w-4" /> },
];

function firstAllowedView(reports: boolean, assets: boolean, comments: boolean, audits: boolean): View {
  if (reports) return "reports";
  if (assets) return "assets-hidden";
  if (comments) return "comments-hidden";
  if (audits) return "audits";
  return "reports";
}

function viewAllowed(view: View, reports: boolean, assets: boolean, comments: boolean, audits: boolean) {
  if (view === "reports") return reports;
  if (view === "assets-hidden" || view === "assets-deleted") return assets;
  if (view === "comments-hidden") return comments;
  return audits;
}

export function ModerationShell() {
  const { profile, workshopUser, isLoading } = useAuth();
  const permissionSource = workshopUser ?? profile;
  const token = getAccessToken();
  const [view, setView] = useState<View>("reports");
  const [status, setStatus] = useState<ReportStatus>("open");
  const [type, setType] = useState<ReportType>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [auditEventType, setAuditEventType] = useState("");
  const [auditViewMode, setAuditViewMode] = useState<AuditViewMode>("readable");
  const canAccess = canAccessWorkshopModeration(permissionSource);
  const canReadReports = canResolveReports(permissionSource);
  const canReadAssets = canModerateAssets(permissionSource);
  const canReadComments = canModerateComments(permissionSource);
  const canReadAudits = canReadWorkshopAudit(permissionSource);

  const reportsQuery = useQuery({
    queryKey: ["workshop", "moderation", "reports", status, type, page],
    queryFn: () => listModerationReports(token!, status, type === "all" ? undefined : type, page, pageSize),
    enabled: Boolean(token && canReadReports && view === "reports"),
  });
  const openReportsQuery = useQuery({
    queryKey: ["workshop", "moderation", "reports", "open-dot"],
    queryFn: () => listModerationReports(token!, "open", undefined, 1, 1),
    enabled: Boolean(token && canReadReports),
  });
  const assetsQuery = useQuery({
    queryKey: ["workshop", "moderation", "assets", view, page],
    queryFn: () => listModerationAssets(token!, view === "assets-deleted" ? "deleted" : "hidden", page, pageSize),
    enabled: Boolean(token && canReadAssets && (view === "assets-hidden" || view === "assets-deleted")),
  });
  const commentsQuery = useQuery({
    queryKey: ["workshop", "moderation", "comments", "hidden", page],
    queryFn: () => listModerationComments(token!, "hidden", page, pageSize),
    enabled: Boolean(token && canReadComments && view === "comments-hidden"),
  });
  const auditsQuery = useQuery({
    queryKey: ["workshop", "moderation", "audit-events", auditEventType, page],
    queryFn: () => listModerationAuditEvents(token!, auditEventType, page, auditPageSize),
    enabled: Boolean(token && canReadAudits && view === "audits"),
  });

  const reports = useMemo(() => reportsQuery.data?.reports ?? [], [reportsQuery.data?.reports]);
  const assets = useMemo(() => assetsQuery.data?.assets ?? [], [assetsQuery.data?.assets]);
  const comments = useMemo(() => commentsQuery.data?.comments ?? [], [commentsQuery.data?.comments]);
  const auditEvents = useMemo(() => auditsQuery.data?.events ?? [], [auditsQuery.data?.events]);
  const hasOpenReports = (openReportsQuery.data?.total ?? 0) > 0;
  const selectedReport = useMemo(() => reports.find((item) => item.id === selectedId) ?? reports[0] ?? null, [reports, selectedId]);
  const selectedAsset = useMemo(() => assets.find((item) => item.id === selectedId) ?? assets[0] ?? null, [assets, selectedId]);
  const selectedComment = useMemo(() => comments.find((item) => item.id === selectedId) ?? comments[0] ?? null, [comments, selectedId]);

  useEffect(() => {
    if (!canAccess || viewAllowed(view, canReadReports, canReadAssets, canReadComments, canReadAudits)) return;
    setView(firstAllowedView(canReadReports, canReadAssets, canReadComments, canReadAudits));
    setPage(1);
    setSelectedId(null);
  }, [canAccess, canReadAssets, canReadAudits, canReadComments, canReadReports, view]);

  useEffect(() => {
    const first = view === "reports" ? reports[0]?.id : view === "comments-hidden" ? comments[0]?.id : view === "audits" ? null : assets[0]?.id;
    if (!selectedId && first) setSelectedId(first);
  }, [assets, comments, reports, selectedId, view]);

  if (isLoading) return <LoadingPanel />;
  if (!canAccess) return <EmptyPanel title="Moderation unavailable" text="Workshop moderation permissions are required." />;

  function showReports(nextStatus = status, nextType = type) {
    if (!canReadReports) return;
    setView("reports");
    setStatus(nextStatus);
    setType(nextType);
    setPage(1);
    setSelectedId(null);
  }

  function showInventory(nextView: View) {
    if ((nextView === "assets-hidden" || nextView === "assets-deleted") && !canReadAssets) return;
    if (nextView === "comments-hidden" && !canReadComments) return;
    if (nextView === "audits" && !canReadAudits) return;
    setView(nextView);
    setPage(1);
    setSelectedId(null);
  }

  function goPage(nextPage: number) {
    setPage(nextPage);
    setSelectedId(null);
  }

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] bg-background lg:min-h-[calc(100vh-4rem)]">
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:block lg:min-h-[calc(100vh-4rem)]">
        <Sidebar className="shrink-0 bg-card shadow-none lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:pl-3">
          <SidebarHeader>
            <div className="font-primary text-lg font-semibold uppercase">Moderation</div>
          </SidebarHeader>
          {canReadReports ? (
            <>
              <SidebarSection>
                {statusFilters.map((item) => (
                  <SidebarItem key={item.id} active={view === "reports" && status === item.id} icon={<Archive className="h-4 w-4" />} onClick={() => showReports(item.id, type)}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span>{item.label}</span>
                      {item.id === "open" && hasOpenReports ? <NotificationDot /> : null}
                    </span>
                  </SidebarItem>
                ))}
              </SidebarSection>
              <SidebarSection>
                {typeFilters.map((item) => (
                  <SidebarItem key={item.id} active={view === "reports" && type === item.id} icon={item.icon} onClick={() => showReports(status, item.id)}>
                    {item.label}
                  </SidebarItem>
                ))}
              </SidebarSection>
            </>
          ) : null}
          <SidebarSection>
            {canReadAssets ? <SidebarItem active={view === "assets-hidden"} icon={<EyeOff className="h-4 w-4" />} onClick={() => showInventory("assets-hidden")}>Hidden Assets</SidebarItem> : null}
            {canReadAssets ? <SidebarItem active={view === "assets-deleted"} icon={<Trash2 className="h-4 w-4" />} onClick={() => showInventory("assets-deleted")}>Deleted Assets</SidebarItem> : null}
            {canReadComments ? <SidebarItem active={view === "comments-hidden"} icon={<MessageCircle className="h-4 w-4" />} onClick={() => showInventory("comments-hidden")}>Hidden Comments</SidebarItem> : null}
            {canReadAudits ? <SidebarItem active={view === "audits"} icon={<FileText className="h-4 w-4" />} onClick={() => showInventory("audits")}>Audit Logs</SidebarItem> : null}
          </SidebarSection>
        </Sidebar>

        <section className={`grid min-w-0 gap-4 px-4 py-6 lg:ml-64 lg:px-8 ${view === "audits" ? "" : "lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]"}`}>
          {view === "audits" ? (
            <AuditLogView
              events={auditEvents}
              error={auditsQuery.isError}
              eventType={auditEventType}
              loading={auditsQuery.isLoading}
              mode={auditViewMode}
              page={page}
              total={auditsQuery.data?.total ?? 0}
              onEventType={setAuditEventType}
              onMode={setAuditViewMode}
              onPage={goPage}
              onRefresh={() => void auditsQuery.refetch()}
            />
          ) : view === "reports" ? (
            <>
              <div className="grid content-start gap-3">
                <ReportList reports={reports} selectedId={selectedReport?.id ?? null} loading={reportsQuery.isLoading} error={reportsQuery.isError} onSelect={setSelectedId} />
                <PageControls total={reportsQuery.data?.total ?? 0} page={page} onPage={goPage} />
              </div>
              <ReportDetail report={selectedReport} note={note} onNote={setNote} onDone={() => { setNote(""); void invalidateModeration(); }} />
            </>
          ) : view === "comments-hidden" ? (
            <>
              <div className="grid content-start gap-3">
                <CommentList comments={comments} selectedId={selectedComment?.id ?? null} loading={commentsQuery.isLoading} error={commentsQuery.isError} onSelect={setSelectedId} />
                <PageControls total={commentsQuery.data?.total ?? 0} page={page} onPage={goPage} />
              </div>
              <CommentDetail comment={selectedComment} onDone={() => void invalidateModeration()} />
            </>
          ) : (
            <>
              <div className="grid content-start gap-3">
                <AssetList assets={assets} selectedId={selectedAsset?.id ?? null} loading={assetsQuery.isLoading} error={assetsQuery.isError} onSelect={setSelectedId} />
                <PageControls total={assetsQuery.data?.total ?? 0} page={page} onPage={goPage} />
              </div>
              <AssetDetail asset={selectedAsset} deleted={view === "assets-deleted"} onDone={() => void invalidateModeration()} />
            </>
          )}
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
    <div className="grid content-start gap-3">
      {reports.map((report) => (
        <button key={report.id} type="button" className={listItemClass(selectedId === report.id)} onClick={() => onSelect(report.id)}>
          <ListTitle title={targetTitle(report)} badge={report.status} dot={report.status === "open"} />
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs leading-5 text-muted-foreground">
            <span>{report.reason}</span>
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function AuditLogView({
  events,
  error,
  eventType,
  loading,
  mode,
  page,
  total,
  onEventType,
  onMode,
  onPage,
  onRefresh,
}: {
  events: WorkshopAuditEvent[];
  error: boolean;
  eventType: string;
  loading: boolean;
  mode: AuditViewMode;
  page: number;
  total: number;
  onEventType: (value: string) => void;
  onMode: (value: AuditViewMode) => void;
  onPage: (page: number) => void;
  onRefresh: () => void;
}) {
  const columns = mode === "readable" ? [
    {
      key: "created",
      header: "Timestamp",
      cell: (event: WorkshopAuditEvent) => <span className="whitespace-nowrap tabular-nums">{formatDate(event.createdAt)}</span>,
    },
    {
      key: "activity",
      header: "Activity",
      cell: (event: WorkshopAuditEvent) => <div className="text-sm text-foreground">{renderAuditActivity(event)}</div>,
    },
  ] : [
    { key: "created", header: "Created", cell: (event: WorkshopAuditEvent) => formatDate(event.createdAt) },
    { key: "event", header: "Event", cell: (event: WorkshopAuditEvent) => <Badge variant="outline">{event.eventType}</Badge> },
    { key: "actor", header: "Actor", cell: (event: WorkshopAuditEvent) => <span className="font-mono text-xs">{event.actorAuthAccountId ?? "system"}</span> },
    { key: "target", header: "Target", cell: (event: WorkshopAuditEvent) => <span className="font-mono text-xs">{event.targetKind}:{event.targetId}</span> },
    { key: "metadata", header: "Metadata", cell: (event: WorkshopAuditEvent) => <span className="break-all font-mono text-xs text-muted-foreground">{event.metadataJson ?? "-"}</span> },
  ];

  return (
    <div className="grid gap-4">
      <Card className="border-border bg-card text-card-foreground">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <CardTitle>Audit logs</CardTitle>
            <Badge variant="secondary">{total} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <FilterBar className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <SearchInput value={eventType} onChange={(event: { target: { value: string } }) => { onEventType(event.target.value); onPage(1); }} onClear={() => { onEventType(""); onPage(1); }} placeholder="Filter event type" className="max-w-none" />
            <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:pr-2">
              <Button type="button" variant={mode === "readable" ? "default" : "secondary"} onClick={() => onMode("readable")}>Readable</Button>
              <Button type="button" variant={mode === "technical" ? "default" : "secondary"} onClick={() => onMode("technical")}>Technical</Button>
              <Button type="button" variant="secondary" onClick={onRefresh}>Refresh</Button>
            </div>
          </FilterBar>
        </CardContent>
      </Card>

      <Card className="border-border bg-card text-card-foreground">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center p-6"><Spinner label="Loading audit logs" /></div>
          ) : error ? (
            <EmptyState title="Could not load audit logs" description="Try again or check your Workshop audit permission." action={<Button type="button" onClick={onRefresh}>Try again</Button>} />
          ) : (
            <DataTable className="admin-data-table" columns={columns} data={events} getRowKey={(event) => event.id} emptyTitle="No audit events" emptyDescription="Try another event type filter." />
          )}
        </CardContent>
      </Card>

      <PageControls total={total} page={page} pageSize={auditPageSize} onPage={onPage} />
    </div>
  );
}

function AssetList({ assets, selectedId, loading, error, onSelect }: { assets: WorkshopAsset[]; selectedId: string | null; loading: boolean; error: boolean; onSelect: (id: string) => void }) {
  if (loading) return <LoadingPanel />;
  if (error) return <EmptyPanel title="Assets unavailable" text="Could not load moderated assets." />;
  if (!assets.length) return <EmptyPanel title="No assets" text="Nothing matches this queue." />;
  return (
    <div className="grid content-start gap-3">
      {assets.map((asset) => (
        <button key={asset.id} type="button" className={listItemClass(selectedId === asset.id)} onClick={() => onSelect(asset.id)}>
          <ListTitle title={asset.title} badge={asset.status} />
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs leading-5 text-muted-foreground">
            <span>/{asset.creatorName}/{asset.assetSlug}</span>
            <span>{formatDate(asset.updatedAt)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function CommentList({ comments, selectedId, loading, error, onSelect }: { comments: WorkshopComment[]; selectedId: string | null; loading: boolean; error: boolean; onSelect: (id: string) => void }) {
  if (loading) return <LoadingPanel />;
  if (error) return <EmptyPanel title="Comments unavailable" text="Could not load hidden comments." />;
  if (!comments.length) return <EmptyPanel title="No comments" text="Nothing matches this queue." />;
  return (
    <div className="grid content-start gap-3">
      {comments.map((comment) => (
        <button key={comment.id} type="button" className={listItemClass(selectedId === comment.id)} onClick={() => onSelect(comment.id)}>
          <ListTitle title={comment.body} badge={comment.status} />
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs leading-5 text-muted-foreground">
            <span>{comment.authorDisplayName}</span>
            <span>{formatDate(comment.updatedAt)}</span>
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
  const [confirmAction, setConfirmAction] = useState<ReportAction | null>(null);
  const run = useMutation({
    mutationFn: async (action: ReportAction | "dismiss") => {
      if (!report || !token) return;
      const assetId = snapshotValue(snapshot, "publicId") || report.targetId;
      if (action === "hide-asset") {
        await hideModerationAsset(assetId, token);
        await resolveModerationReport(report.id, token, note);
      }
      if (action === "delete-asset") {
        await deleteWorkshopAsset(assetId, token);
        await resolveModerationReport(report.id, token, note);
      }
      if (action === "hide-comment") {
        await hideModerationComment(report.targetId, token);
        await resolveModerationReport(report.id, token, note);
      }
      if (action === "dismiss") await dismissModerationReport(report.id, token, note);
    },
    onSuccess: (_, action) => {
      toast.success("Moderation updated", { description: action === "dismiss" ? "Report dismissed." : "Report resolved." });
      setConfirmAction(null);
      onDone();
    },
    onError: (error) => toast.error("Moderation failed", { description: error instanceof Error ? error.message : "Try again." }),
  });

  if (!report) return <EmptyPanel title="Select a report" text="Choose a report from the queue." />;

  return (
    <>
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
          <DetailRow label="Reporter" value={actorLabel(report.reporterDisplayName, report.reporterAuthAccountId)} />
          <DetailRow label="Target Owner" value={actorLabel(report.targetOwnerDisplayName, report.targetOwnerAuthAccountId)} />
          {report.targetType === "comment" ? <DetailRow label="Comment" value={snapshotValue(snapshot, "body") || "No comment snapshot"} /> : null}
          <DetailRow label="Snapshot" value={snapshotSummary(snapshot)} />
        </div>
        <Textarea value={note} maxLength={1000} rows={3} placeholder="Optional moderator note" onChange={(event) => onNote(event.target.value)} />
        <div className="flex flex-wrap gap-2">
          {report.targetType === "asset" && report.status === "open" && canModerateAssets(permissionSource) && canResolveReports(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => setConfirmAction("hide-asset")}><EyeOff className="h-4 w-4" />HIDE</Button> : null}
          {report.targetType === "asset" && report.status === "open" && canModerateAssets(permissionSource) && canResolveReports(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => setConfirmAction("delete-asset")}><Trash2 className="h-4 w-4" />DELETE</Button> : null}
          {report.targetType === "comment" && report.status === "open" && canModerateComments(permissionSource) && canResolveReports(permissionSource) ? <Button size="sm" variant="destructive" disabled={run.isPending} onClick={() => setConfirmAction("hide-comment")}><EyeOff className="h-4 w-4" />HIDE</Button> : null}
          {canResolveReports(permissionSource) && report.status === "open" ? <Button size="sm" variant="ghost" disabled={run.isPending} onClick={() => run.mutate("dismiss")}>DISMISS</Button> : null}
        </div>
      </CardContent>
    </Card>
    <ConfirmDialog
      open={confirmAction !== null}
      title={confirmTitle(confirmAction)}
      description={confirmDescription(confirmAction)}
      confirmLabel={confirmLabel(confirmAction)}
      busy={run.isPending}
      onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
      onConfirm={() => { if (confirmAction) run.mutate(confirmAction); }}
    />
    </>
  );
}

function AssetDetail({ asset, deleted, onDone }: { asset: WorkshopAsset | null; deleted: boolean; onDone: () => void }) {
  const token = getAccessToken();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [slugOpen, setSlugOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const restore = useMutation({
    mutationFn: (assetSlug?: string | null) => restoreModerationAsset(asset!.publicId || asset!.id, token!, assetSlug),
    onSuccess: () => {
      toast.success("Asset restored", { description: "The asset is public again." });
      setConfirmOpen(false);
      setSlugOpen(false);
      setSlug("");
      onDone();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Try again.";
      if (message.includes("assetSlug")) {
        setSlug(asset ? `${asset.assetSlug}-restored` : "");
        setSlugOpen(true);
        return;
      }
      toast.error("Restore failed", { description: message });
    },
  });
  const normalizedSlug = normalizeSlug(slug);

  if (!asset) return <EmptyPanel title="Select an asset" text="Choose an asset from the queue." />;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">{asset.title}</CardTitle>
          <Badge variant="outline">{asset.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <DetailRow label="Link" value={`/${asset.creatorName}/${asset.assetSlug}`} />
        <DetailRow label="Owner" value={asset.ownerAuthAccountId} />
        <DetailRow label="Updated" value={formatDate(asset.updatedAt)} />
        <DetailRow label="Summary" value={asset.shortDescription || asset.descriptionMarkdown || "None"} />
        {!deleted && asset.status === "hidden" ? <Button size="sm" disabled={restore.isPending} onClick={() => setConfirmOpen(true)}><RotateCcw className="h-4 w-4" />RESTORE</Button> : null}
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        title="Restore Asset?"
        description="This will make the asset public again. Continue only if moderation is complete."
        confirmLabel="RESTORE"
        busy={restore.isPending}
        onOpenChange={setConfirmOpen}
        onConfirm={() => restore.mutate(null)}
      />
      <Dialog open={slugOpen} onOpenChange={setSlugOpen}>
        <DialogContent variant="destructive">
          <DialogHeader>
            <DialogTitle>Restore With New Link</DialogTitle>
            <DialogDescription>This asset&apos;s old link is already used. Enter a new slug to restore it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="restore-asset-slug">New slug</Label>
            <Input id="restore-asset-slug" className="h-10 text-sm" value={slug} onChange={(event) => setSlug(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSlugOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!normalizedSlug || restore.isPending} onClick={() => restore.mutate(normalizedSlug)}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CommentDetail({ comment, onDone }: { comment: WorkshopComment | null; onDone: () => void }) {
  const token = getAccessToken();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const restore = useMutation({
    mutationFn: () => restoreModerationComment(comment!.id, token!),
    onSuccess: () => {
      toast.success("Comment restored", { description: "The comment is visible again." });
      setConfirmOpen(false);
      onDone();
    },
    onError: (error) => toast.error("Restore failed", { description: error instanceof Error ? error.message : "Try again." }),
  });

  if (!comment) return <EmptyPanel title="Select a comment" text="Choose a comment from the queue." />;

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">Hidden Comment</CardTitle>
          <Badge variant="outline">{comment.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <DetailRow label="Body" value={comment.body} />
        <DetailRow label="Author" value={comment.authorDisplayName} />
        <DetailRow label="Updated" value={formatDate(comment.updatedAt)} />
        {comment.status === "hidden" ? <Button size="sm" disabled={restore.isPending} onClick={() => setConfirmOpen(true)}><RotateCcw className="h-4 w-4" />RESTORE</Button> : null}
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        title="Restore Comment?"
        description="This will make the hidden comment visible again."
        confirmLabel="RESTORE"
        busy={restore.isPending}
        onOpenChange={setConfirmOpen}
        onConfirm={() => restore.mutate()}
      />
    </Card>
  );
}

function ListTitle({ title, badge, dot = false }: { title: string; badge: string; dot?: boolean }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className="flex min-w-0 items-start gap-2">
        {dot ? <NotificationDot className="mt-1.5 shrink-0" /> : null}
        <span className="min-w-0 break-words font-primary text-sm uppercase leading-snug line-clamp-2">{title}</span>
      </span>
      <Badge className="shrink-0" variant={badge === "open" ? "secondary" : "outline"}>{badge}</Badge>
    </div>
  );
}

function NotificationDot({ className = "" }: { className?: string }) {
  return <span className={`inline-block h-2 w-2 rounded-full bg-red-500 ${className}`} aria-hidden="true" />;
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

function listItemClass(active: boolean) {
  return `grid !h-auto !min-h-24 content-start gap-2 overflow-hidden border p-3 text-left transition-colors hover:border-primary hover:bg-card ${active ? "border-primary bg-card" : "border-border bg-card/40"}`;
}

function PageControls({ total, page, onPage, pageSize: size = pageSize }: { total: number; page: number; onPage: (page: number) => void; pageSize?: number }) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border border-border bg-card/40 p-3">
      <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

async function invalidateModeration() {
  await queryClient.invalidateQueries({ queryKey: ["workshop", "moderation"] });
}

function targetTitle(report: WorkshopReport) {
  const snapshot = parseSnapshot(report.snapshotJson);
  if (report.targetType === "asset") return snapshotValue(snapshot, "title") || snapshotValue(snapshot, "assetTitle") || "Asset report";
  if (report.targetType === "comment") return snapshotValue(snapshot, "assetTitle") || "Comment report";
  if (report.targetType === "account") return snapshotValue(snapshot, "displayName") || snapshotValue(snapshot, "creatorName") || "Account report";
  return "Report";
}

function snapshotSummary(snapshot: Record<string, unknown>) {
  return snapshotValue(snapshot, "title") || snapshotValue(snapshot, "assetTitle") || snapshotValue(snapshot, "body") || snapshotValue(snapshot, "displayName") || snapshotValue(snapshot, "creatorName") || "No snapshot";
}

function renderAuditActivity(event: WorkshopAuditEvent) {
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

function actorLabel(displayName?: string | null, fallback?: string) {
  return displayName?.trim() || fallback || "Unknown";
}

function confirmTitle(action: ReportAction | null) {
  if (action === "delete-asset") return "Delete Asset?";
  if (action === "hide-comment") return "Hide Comment?";
  return "Hide Asset?";
}

function confirmDescription(action: ReportAction | null) {
  if (action === "delete-asset") return "This removes the asset from public workshop listings and resolves the report.";
  if (action === "hide-comment") return "This hides the reported comment and resolves the report.";
  return "This hides the asset from public workshop listings and resolves the report.";
}

function confirmLabel(action: ReportAction | null) {
  if (action === "delete-asset") return "DELETE";
  if (action === "hide-comment") return "HIDE";
  return "HIDE";
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent variant="destructive">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function snapshotValue(snapshot: Record<string, unknown>, key: string) {
  const pascal = `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  const value = snapshot[key] ?? snapshot[pascal];
  return typeof value === "string" ? value : "";
}

function parseSnapshot(value?: string): Record<string, string> {
  try {
    return JSON.parse(value || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function normalizeSlug(value: string | undefined) {
  return value?.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) ?? "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
