"use client";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, Sidebar, SidebarHeader, SidebarItem, SidebarSection, Spinner, Textarea } from "@aottg2/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Archive, EyeOff, FileWarning, MessageCircle, RotateCcw, ShieldAlert, Trash2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { canAccessWorkshopModeration, canModerateAssets, canModerateComments, canResolveReports } from "../auth/workshopPermissions";
import { getAccessToken } from "../auth/storage";
import { useAuth } from "../auth/useAuth";
import { deleteWorkshopAsset, dismissModerationReport, hideModerationAsset, hideModerationComment, listModerationAssets, listModerationComments, listModerationReports, resolveModerationReport, restoreModerationAsset, restoreModerationComment, type WorkshopAsset, type WorkshopComment, type WorkshopReport } from "../lib/api/workshop";
import { queryClient } from "../lib/queryClient";
import { toast } from "../lib/toast";

type ReportStatus = "open" | "resolved" | "dismissed";
type ReportType = "all" | "asset" | "comment" | "account";
type View = "reports" | "assets-hidden" | "assets-deleted" | "comments-hidden";
type ReportAction = "hide-asset" | "delete-asset" | "hide-comment";

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

export function ModerationShell() {
  const { profile, workshopUser, isLoading } = useAuth();
  const permissionSource = workshopUser ?? profile;
  const token = getAccessToken();
  const [view, setView] = useState<View>("reports");
  const [status, setStatus] = useState<ReportStatus>("open");
  const [type, setType] = useState<ReportType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const canAccess = canAccessWorkshopModeration(permissionSource);

  const reportsQuery = useQuery({
    queryKey: ["workshop", "moderation", "reports", status, type],
    queryFn: () => listModerationReports(token!, status, type === "all" ? undefined : type, 1, 48),
    enabled: Boolean(token && canAccess && view === "reports"),
  });
  const assetsQuery = useQuery({
    queryKey: ["workshop", "moderation", "assets", view],
    queryFn: () => listModerationAssets(token!, view === "assets-deleted" ? "deleted" : "hidden", 1, 48),
    enabled: Boolean(token && canAccess && (view === "assets-hidden" || view === "assets-deleted")),
  });
  const commentsQuery = useQuery({
    queryKey: ["workshop", "moderation", "comments", "hidden"],
    queryFn: () => listModerationComments(token!, "hidden", 1, 48),
    enabled: Boolean(token && canAccess && view === "comments-hidden"),
  });

  const reports = useMemo(() => reportsQuery.data?.reports ?? [], [reportsQuery.data?.reports]);
  const assets = useMemo(() => assetsQuery.data?.assets ?? [], [assetsQuery.data?.assets]);
  const comments = useMemo(() => commentsQuery.data?.comments ?? [], [commentsQuery.data?.comments]);
  const selectedReport = useMemo(() => reports.find((item) => item.id === selectedId) ?? reports[0] ?? null, [reports, selectedId]);
  const selectedAsset = useMemo(() => assets.find((item) => item.id === selectedId) ?? assets[0] ?? null, [assets, selectedId]);
  const selectedComment = useMemo(() => comments.find((item) => item.id === selectedId) ?? comments[0] ?? null, [comments, selectedId]);

  useEffect(() => {
    const first = view === "reports" ? reports[0]?.id : view === "comments-hidden" ? comments[0]?.id : assets[0]?.id;
    if (!selectedId && first) setSelectedId(first);
  }, [assets, comments, reports, selectedId, view]);

  if (isLoading) return <LoadingPanel />;
  if (!canAccess) return <EmptyPanel title="Moderation unavailable" text="Workshop moderation permissions are required." />;

  function showReports(nextStatus = status, nextType = type) {
    setView("reports");
    setStatus(nextStatus);
    setType(nextType);
    setSelectedId(null);
  }

  function showInventory(nextView: View) {
    setView(nextView);
    setSelectedId(null);
  }

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] bg-background lg:min-h-[calc(100vh-4rem)]">
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:block lg:min-h-[calc(100vh-4rem)]">
        <Sidebar className="shrink-0 bg-card shadow-none lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:pl-3">
          <SidebarHeader>
            <div className="font-primary text-lg font-semibold uppercase">Moderation</div>
          </SidebarHeader>
          <SidebarSection>
            {statusFilters.map((item) => (
              <SidebarItem key={item.id} active={view === "reports" && status === item.id} icon={<Archive className="h-4 w-4" />} onClick={() => showReports(item.id, type)}>
                {item.label}
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
          <SidebarSection>
            <SidebarItem active={view === "assets-hidden"} icon={<EyeOff className="h-4 w-4" />} onClick={() => showInventory("assets-hidden")}>Hidden Assets</SidebarItem>
            <SidebarItem active={view === "assets-deleted"} icon={<Trash2 className="h-4 w-4" />} onClick={() => showInventory("assets-deleted")}>Deleted Assets</SidebarItem>
            <SidebarItem active={view === "comments-hidden"} icon={<MessageCircle className="h-4 w-4" />} onClick={() => showInventory("comments-hidden")}>Hidden Comments</SidebarItem>
          </SidebarSection>
        </Sidebar>

        <section className="grid min-w-0 gap-4 px-4 py-6 lg:ml-64 lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] lg:px-8">
          {view === "reports" ? (
            <>
              <ReportList reports={reports} selectedId={selectedReport?.id ?? null} loading={reportsQuery.isLoading} error={reportsQuery.isError} onSelect={setSelectedId} />
              <ReportDetail report={selectedReport} note={note} onNote={setNote} onDone={() => { setNote(""); void invalidateModeration(); }} />
            </>
          ) : view === "comments-hidden" ? (
            <>
              <CommentList comments={comments} selectedId={selectedComment?.id ?? null} loading={commentsQuery.isLoading} error={commentsQuery.isError} onSelect={setSelectedId} />
              <CommentDetail comment={selectedComment} onDone={() => void invalidateModeration()} />
            </>
          ) : (
            <>
              <AssetList assets={assets} selectedId={selectedAsset?.id ?? null} loading={assetsQuery.isLoading} error={assetsQuery.isError} onSelect={setSelectedId} />
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
          <ListTitle title={targetTitle(report)} badge={report.status} />
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 overflow-hidden text-xs leading-5 text-muted-foreground">
            <span>{report.reason}</span>
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </button>
      ))}
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

function ListTitle({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <span className="min-w-0 break-words font-primary text-sm uppercase leading-snug line-clamp-2">{title}</span>
      <Badge className="shrink-0" variant={badge === "open" ? "secondary" : "outline"}>{badge}</Badge>
    </div>
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

function listItemClass(active: boolean) {
  return `grid !h-auto !min-h-24 content-start gap-2 overflow-hidden border p-3 text-left transition-colors hover:border-primary hover:bg-card ${active ? "border-primary bg-card" : "border-border bg-card/40"}`;
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
