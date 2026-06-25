"use client";

import { Sidebar, SidebarHeader, SidebarItem, SidebarSection } from "@aottg2/ui";
import { useQuery } from "@tanstack/react-query";
import { Archive, EyeOff, FileText, MessageCircle, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@/auth/storage";
import { useAuth } from "@/auth/useAuth";
import { canAccessWorkshopModeration, canModerateAssets, canModerateComments, canReadWorkshopAudit, canResolveReports } from "@/auth/workshopPermissions";
import { Pagination } from "@/components/Pagination";
import { listModerationAssets, listModerationAuditEvents, listModerationComments, listModerationReports, listModerationUsers } from "@/lib/api/workshop";
import { statusFilters, typeFilters } from "./filters";
import { firstAllowedView, viewAllowed } from "./permissions";
import { auditPageSize, pageSize, type AuditViewMode, type ReportStatus, type ReportType, type View } from "./types";
import { AuditLogView } from "./components/AuditLogView";
import { AssetList, ModerationAssetDetail } from "./components/AssetModeration";
import { CommentDetail, CommentList } from "./components/CommentModeration";
import { EmptyPanel, LoadingPanel, NotificationDot } from "./components/Common";
import { ReportDetail } from "./components/ReportDetail";
import { ReportList } from "./components/ReportList";
import { UserDetail, UserList, UserQueueSearch } from "./components/UserModeration";
import { invalidateModeration } from "./utils";

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
  const [userSearch, setUserSearch] = useState("");
  const [auditEventType, setAuditEventType] = useState("");
  const [auditViewMode, setAuditViewMode] = useState<AuditViewMode>("readable");
  const canAccess = canAccessWorkshopModeration(permissionSource);
  const canReadReports = canResolveReports(permissionSource);
  const canReadAssets = canModerateAssets(permissionSource);
  const canReadComments = canModerateComments(permissionSource);
  const canReadAudits = canReadWorkshopAudit(permissionSource);
  const canReadUsers = canResolveReports(permissionSource);

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
  const usersQuery = useQuery({
    queryKey: ["workshop", "moderation", "users", userSearch, page],
    queryFn: () => listModerationUsers(token!, userSearch, true, page, pageSize),
    enabled: Boolean(token && canReadUsers && view === "users"),
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
  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);
  const comments = useMemo(() => commentsQuery.data?.comments ?? [], [commentsQuery.data?.comments]);
  const auditEvents = useMemo(() => auditsQuery.data?.events ?? [], [auditsQuery.data?.events]);
  const hasOpenReports = (openReportsQuery.data?.total ?? 0) > 0;
  const selectedReport = useMemo(() => reports.find((item) => item.id === selectedId) ?? reports[0] ?? null, [reports, selectedId]);
  const selectedAsset = useMemo(() => assets.find((item) => item.id === selectedId) ?? assets[0] ?? null, [assets, selectedId]);
  const selectedUser = useMemo(() => users.find((item) => item.authAccountId === selectedId) ?? users[0] ?? null, [users, selectedId]);
  const selectedComment = useMemo(() => comments.find((item) => item.id === selectedId) ?? comments[0] ?? null, [comments, selectedId]);

  useEffect(() => {
    if (!canAccess || viewAllowed(view, canReadReports, canReadUsers, canReadAssets, canReadComments, canReadAudits)) return;
    setView(firstAllowedView(canReadReports, canReadUsers, canReadAssets, canReadComments, canReadAudits));
    setPage(1);
    setSelectedId(null);
  }, [canAccess, canReadAssets, canReadAudits, canReadComments, canReadReports, canReadUsers, view]);

  useEffect(() => {
    const first = view === "reports" ? reports[0]?.id : view === "users" ? users[0]?.authAccountId : view === "comments-hidden" ? comments[0]?.id : view === "audits" ? null : assets[0]?.id;
    if (!selectedId && first) setSelectedId(first);
  }, [assets, comments, reports, selectedId, users, view]);

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
    if (nextView === "users" && !canReadUsers) return;
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
            {canReadUsers ? <SidebarItem active={view === "users"} icon={<UserRound className="h-4 w-4" />} onClick={() => showInventory("users")}>Users</SidebarItem> : null}
            {canReadAssets ? <SidebarItem active={view === "assets-hidden"} icon={<EyeOff className="h-4 w-4" />} onClick={() => showInventory("assets-hidden")}>Hidden Assets</SidebarItem> : null}
            {canReadAssets ? <SidebarItem active={view === "assets-deleted"} icon={<Trash2 className="h-4 w-4" />} onClick={() => showInventory("assets-deleted")}>Deleted Assets</SidebarItem> : null}
            {canReadComments ? <SidebarItem active={view === "comments-hidden"} icon={<MessageCircle className="h-4 w-4" />} onClick={() => showInventory("comments-hidden")}>Hidden Comments</SidebarItem> : null}
            {canReadAudits ? <SidebarItem active={view === "audits"} icon={<FileText className="h-4 w-4" />} onClick={() => showInventory("audits")}>Audit Logs</SidebarItem> : null}
          </SidebarSection>
        </Sidebar>

        <section className={"grid min-w-0 gap-4 px-4 py-6 lg:ml-64 lg:px-8 " + (view === "audits" ? "" : "lg:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]")}>
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
          ) : view === "users" ? (
            <>
              <div className="grid content-start gap-3">
                <UserQueueSearch value={userSearch} onChange={(value) => { setUserSearch(value); setPage(1); setSelectedId(null); }} />
                <UserList users={users} selectedId={selectedUser?.authAccountId ?? null} loading={usersQuery.isLoading} error={usersQuery.isError} onSelect={setSelectedId} />
                <Pagination total={usersQuery.data?.total ?? 0} page={page} pageSize={pageSize} onPage={goPage} />
              </div>
              <UserDetail user={selectedUser} onDone={() => void invalidateModeration()} />
            </>
          ) : view === "reports" ? (
            <>
              <div className="grid content-start gap-3">
                <ReportList reports={reports} selectedId={selectedReport?.id ?? null} loading={reportsQuery.isLoading} error={reportsQuery.isError} onSelect={setSelectedId} />
                <Pagination total={reportsQuery.data?.total ?? 0} page={page} pageSize={pageSize} onPage={goPage} />
              </div>
              <ReportDetail report={selectedReport} note={note} onNote={setNote} onDone={() => { setNote(""); void invalidateModeration(); }} />
            </>
          ) : view === "comments-hidden" ? (
            <>
              <div className="grid content-start gap-3">
                <CommentList comments={comments} selectedId={selectedComment?.id ?? null} loading={commentsQuery.isLoading} error={commentsQuery.isError} onSelect={setSelectedId} />
                <Pagination total={commentsQuery.data?.total ?? 0} page={page} pageSize={pageSize} onPage={goPage} />
              </div>
              <CommentDetail comment={selectedComment} onDone={() => void invalidateModeration()} />
            </>
          ) : (
            <>
              <div className="grid content-start gap-3">
                <AssetList assets={assets} selectedId={selectedAsset?.id ?? null} loading={assetsQuery.isLoading} error={assetsQuery.isError} onSelect={setSelectedId} />
                <Pagination total={assetsQuery.data?.total ?? 0} page={page} pageSize={pageSize} onPage={goPage} />
              </div>
              <ModerationAssetDetail asset={selectedAsset} deleted={view === "assets-deleted"} onDone={() => void invalidateModeration()} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
