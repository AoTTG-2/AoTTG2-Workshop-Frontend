"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, CommentBox, Sidebar, SidebarHeader, SidebarItem, SidebarSection, Spinner, StatCard, renderCommentMarkdown } from "@aottg2/ui";
import { Bell, Eye, FolderOpen, MessageCircle, Pin, ThumbsUp, Download, Star } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { getAccessToken } from "../auth/storage";
import { WorkshopAssetCard } from "../components/WorkshopAssetCard";
import { queryClient } from "../lib/queryClient";
import {
  assetPath,
  getCreatorDashboard,
  getFeaturedAssets,
  listAssets,
  listDashboardComments,
  listFavoriteAssets,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  replyToAssetComment,
  setFeaturedAssets,
  type DashboardComment,
  type WorkshopAsset,
  type WorkshopNotification,
} from "../lib/api/workshop";
import { toast } from "../lib/toast";

type DashboardTab = "overview" | "assets" | "favorites" | "comments" | "notifications" | "featured";

const tabs: { id: DashboardTab; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Eye className="h-4 w-4" /> },
  { id: "assets", label: "Assets", icon: <FolderOpen className="h-4 w-4" /> },
  { id: "favorites", label: "Favorites", icon: <Star className="h-4 w-4" /> },
  { id: "comments", label: "Comments", icon: <MessageCircle className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "featured", label: "Featured", icon: <Pin className="h-4 w-4" /> },
];

export function DashboardShell() {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const token = getAccessToken();

  const dashboardQuery = useQuery({
    queryKey: ["workshop", "dashboard"],
    queryFn: () => getCreatorDashboard(token!),
    enabled: Boolean(token),
  });

  const unread = dashboardQuery.data?.unreadNotificationCount ?? 0;

  return (
    <main className="relative min-h-[calc(100vh-3.5rem)] bg-background lg:min-h-[calc(100vh-4rem)]">
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:block lg:min-h-[calc(100vh-4rem)]">
        <Sidebar className="shrink-0 bg-card shadow-none lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 lg:pl-3">
          <SidebarHeader className="gap-2">
            <div className="font-primary text-lg font-semibold uppercase">Creator Dashboard</div>
          </SidebarHeader>
          <SidebarSection>
            {tabs.map((item) => (
              <SidebarItem key={item.id} active={tab === item.id} icon={item.icon} onClick={() => setTab(item.id)}>
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span>{item.label}</span>
                  {item.id === "notifications" && unread > 0 ? <NotificationDot /> : null}
                </span>
              </SidebarItem>
            ))}
          </SidebarSection>
        </Sidebar>

        <section className="min-w-0 space-y-5 px-4 py-6 lg:ml-64 lg:px-8">
          {dashboardQuery.isLoading ? (
            <div className="grid min-h-96 place-items-center border border-border bg-card/40">
              <Spinner variant="primary" label="Loading dashboard" />
            </div>
          ) : dashboardQuery.isError ? (
            <EmptyPanel title="Dashboard unavailable" text="Could not load creator dashboard." />
          ) : dashboardQuery.data ? (
            <>
              {tab === "overview" ? <OverviewPanel data={dashboardQuery.data} onTab={setTab} /> : null}
              {tab === "assets" ? <AssetsPanel /> : null}
              {tab === "favorites" ? <FavoritesPanel /> : null}
              {tab === "comments" ? <CommentsPanel /> : null}
              {tab === "notifications" ? <NotificationsPanel /> : null}
              {tab === "featured" ? <FeaturedPanel /> : null}
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function OverviewPanel({ data, onTab }: { data: Awaited<ReturnType<typeof getCreatorDashboard>>; onTab: (tab: DashboardTab) => void }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assets" value={formatCount(data.stats.assetCount)} hint={`${data.stats.skinPartCount} parts / ${data.stats.skinSetCount} sets`} icon={<FolderOpen className="h-5 w-5" />} />
        <StatCard label="Downloads" value={formatCount(data.stats.downloadCount)} icon={<Download className="h-5 w-5" />} />
        <StatCard label="Thanks" value={formatCount(data.stats.likeCount)} icon={<ThumbsUp className="h-5 w-5" />} />
        <StatCard label="Comments" value={formatCount(data.stats.commentCount)} icon={<MessageCircle className="h-5 w-5" />} />
      </div>

      <DashboardSection title="Recent Assets" action={<Button variant="secondary" size="sm" onClick={() => onTab("assets")}>Manage</Button>}>
        <AssetGrid assets={data.recentAssets} empty="No assets yet." />
      </DashboardSection>
    </div>
  );
}

function AssetsPanel() {
  const router = useRouter();
  const token = getAccessToken();
  const assetsQuery = useQuery({
    queryKey: ["workshop", "dashboard-assets"],
    queryFn: () => listAssets({ mine: true, pageSize: 48 }, token),
    enabled: Boolean(token),
  });

  if (assetsQuery.isLoading) return <LoadingPanel />;
  if (assetsQuery.isError) return <EmptyPanel title="Assets unavailable" text="Could not load your assets." />;
  return <AssetGrid assets={assetsQuery.data?.assets ?? []} empty="No assets yet." onOpen={(asset) => router.push(assetPath(asset))} />;
}

function FavoritesPanel() {
  const router = useRouter();
  const token = getAccessToken();
  const favoritesQuery = useQuery({
    queryKey: ["workshop", "dashboard-favorites"],
    queryFn: () => listFavoriteAssets(token!, 1, 48),
    enabled: Boolean(token),
  });

  if (favoritesQuery.isLoading) return <LoadingPanel />;
  if (favoritesQuery.isError) return <EmptyPanel title="Favorites unavailable" text="Could not load your favorites." />;
  return <AssetGrid assets={favoritesQuery.data?.assets ?? []} empty="No favorites yet." onOpen={(asset) => router.push(assetPath(asset))} />;
}

function CommentsPanel() {
  const token = getAccessToken();
  const commentsQuery = useQuery({
    queryKey: ["workshop", "dashboard-comments"],
    queryFn: () => listDashboardComments(token!, 1, 48),
    enabled: Boolean(token),
  });

  if (commentsQuery.isLoading) return <LoadingPanel />;
  if (commentsQuery.isError) return <EmptyPanel title="Comments unavailable" text="Could not load comments." />;
  return <CommentRows comments={commentsQuery.data?.comments ?? []} />;
}

function NotificationsPanel() {
  const token = getAccessToken();
  const notificationsQuery = useQuery({
    queryKey: ["workshop", "notifications"],
    queryFn: () => listNotifications(token!, 1, 48),
    enabled: Boolean(token),
  });
  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(token!),
    onSuccess: async () => {
      await invalidateDashboard();
    },
  });

  if (notificationsQuery.isLoading) return <LoadingPanel />;
  if (notificationsQuery.isError) return <EmptyPanel title="Notifications unavailable" text="Could not load notifications." />;
  return (
    <DashboardSection title="Notifications" action={<Button variant="secondary" size="sm" disabled={!notificationsQuery.data?.unread || markAll.isPending} onClick={() => markAll.mutate()}>Mark All Read</Button>}>
      <NotificationRows notifications={notificationsQuery.data?.notifications ?? []} />
    </DashboardSection>
  );
}

function FeaturedPanel() {
  const token = getAccessToken();
  const router = useRouter();
  const assetsQuery = useQuery({
    queryKey: ["workshop", "dashboard-assets"],
    queryFn: () => listAssets({ mine: true, pageSize: 48 }, token),
    enabled: Boolean(token),
  });
  const featuredQuery = useQuery({
    queryKey: ["workshop", "featured-assets"],
    queryFn: () => getFeaturedAssets(token!),
    enabled: Boolean(token),
  });
  const save = useMutation({
    mutationFn: (ids: string[]) => setFeaturedAssets(token!, ids),
    onSuccess: async () => {
      await invalidateDashboard();
      toast.success("Featured assets saved", { description: "Your public creator page was updated." });
    },
    onError: (error) => toast.error("Could not save featured assets", { description: error instanceof Error ? error.message : "Try again." }),
  });

  const featured = useMemo(() => featuredQuery.data?.assets ?? [], [featuredQuery.data?.assets]);
  const featuredIds = useMemo(() => new Set(featured.map((asset) => asset.id)), [featured]);
  const available = (assetsQuery.data?.assets ?? []).filter((asset) => !featuredIds.has(asset.id));

  function setNext(ids: string[]) {
    save.mutate(ids);
  }

  function move(asset: WorkshopAsset, direction: -1 | 1) {
    const ids = featured.map((item) => item.id);
    const index = ids.indexOf(asset.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return;
    [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
    setNext(ids);
  }

  if (assetsQuery.isLoading || featuredQuery.isLoading) return <LoadingPanel />;
  if (assetsQuery.isError || featuredQuery.isError) return <EmptyPanel title="Featured unavailable" text="Could not load featured assets." />;

  return (
    <div className="grid gap-5">
      <DashboardSection title="Featured Assets">
        {featured.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((asset, index) => (
              <AssetActionCard
                key={asset.id}
                asset={asset}
                onOpen={() => router.push(assetPath(asset))}
                actions={
                  <>
                    <Button size="sm" variant="secondary" disabled={index === 0 || save.isPending} onClick={() => move(asset, -1)}>Up</Button>
                    <Button size="sm" variant="secondary" disabled={index === featured.length - 1 || save.isPending} onClick={() => move(asset, 1)}>Down</Button>
                    <Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => setNext(featured.filter((item) => item.id !== asset.id).map((item) => item.id))}>Remove</Button>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyPanel title="No featured assets" text="Pin assets from your uploads." />
        )}
      </DashboardSection>

      <DashboardSection title="Your Assets">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {available.map((asset) => (
            <AssetActionCard
              key={asset.id}
              asset={asset}
              onOpen={() => router.push(assetPath(asset))}
              actions={<Button size="sm" disabled={featured.length >= 6 || save.isPending} onClick={() => setNext([...featured.map((item) => item.id), asset.id])}>Feature</Button>}
            />
          ))}
        </div>
        {available.length === 0 ? <div className="border border-border bg-card/40 p-4 text-sm text-muted-foreground">No more assets available.</div> : null}
      </DashboardSection>
    </div>
  );
}

function CommentRows({ comments, compact = false }: { comments: DashboardComment[]; compact?: boolean }) {
  if (!comments.length) return <div className="border border-border bg-card/40 p-4 text-sm text-muted-foreground">No comments yet.</div>;
  return (
    <div className="grid gap-3">
      {comments.map((comment) => (
        <CommentRow key={comment.id} comment={comment} compact={compact} />
      ))}
    </div>
  );
}

function CommentRow({ comment, compact }: { comment: DashboardComment; compact?: boolean }) {
  const router = useRouter();
  const token = getAccessToken();
  const [replyOpen, setReplyOpen] = useState(false);
  const [body, setBody] = useState("");
  const canReply = !comment.parentCommentId && comment.status === "visible";
  const reply = useMutation({
    mutationFn: () => replyToAssetComment(comment.assetPublicId, comment.id, body, token!),
    onSuccess: async () => {
      setBody("");
      setReplyOpen(false);
      await invalidateDashboard();
    },
    onError: (error) => toast.error("Could not reply", { description: error instanceof Error ? error.message : "Try again." }),
  });

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{comment.assetTitle}</CardTitle>
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
        </div>
        <div className="text-sm text-muted-foreground">by {comment.authorDisplayName}</div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className={`prose prose-sm max-w-none text-foreground ${compact ? "line-clamp-3" : ""}`}>{renderCommentMarkdown(comment.body)}</div>
        <div className="flex flex-wrap gap-2">
          {canReply ? <Button size="sm" variant="secondary" onClick={() => setReplyOpen((open) => !open)}>Reply</Button> : null}
          <Button size="sm" variant="ghost" onClick={() => router.push(`/${encodeURIComponent(comment.creatorName)}/${encodeURIComponent(comment.assetSlug)}`)}>Open Asset</Button>
        </div>
        {replyOpen ? (
          <CommentBox value={body} onChange={setBody} onSubmit={() => (body.trim() ? reply.mutate() : undefined)} onCancel={() => setReplyOpen(false)} submitLabel={reply.isPending ? "Replying..." : "Reply"} disabled={reply.isPending} placeholder="Write a reply..." />
        ) : null}
      </CardContent>
    </Card>
  );
}

function NotificationRows({ notifications, compact = false }: { notifications: WorkshopNotification[]; compact?: boolean }) {
  if (!notifications.length) return <div className="border border-border bg-card/40 p-4 text-sm text-muted-foreground">No notifications yet.</div>;
  return (
    <div className="grid gap-3">
      {notifications.map((notification) => (
        <NotificationRow key={notification.id} notification={notification} compact={compact} />
      ))}
    </div>
  );
}

function NotificationRow({ notification, compact }: { notification: WorkshopNotification; compact?: boolean }) {
  const router = useRouter();
  const token = getAccessToken();
  const read = useMutation({
    mutationFn: () => markNotificationRead(token!, notification.id),
    onSuccess: invalidateDashboard,
  });
  const meta = parseMetadata(notification.metadataJson);
  const title = notification.type === "creator_followed"
    ? `${meta.displayName ?? "Someone"} followed you`
    : notification.assetTitle || meta.assetTitle || "Workshop update";

  return (
    <div className={`grid gap-2 border border-border bg-card/50 p-4 ${notification.readAt ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-primary text-sm font-semibold uppercase">
          {!notification.readAt ? <NotificationDot /> : null}
          {notificationLabel(notification.type)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</span>
        </div>
      </div>
      <div className={`text-sm text-muted-foreground ${compact ? "line-clamp-2" : ""}`}>{title}</div>
      {meta.commentPreview ? <div className="text-sm text-foreground">{meta.commentPreview}</div> : null}
      <div className="flex flex-wrap gap-2">
        {notification.creatorName && notification.assetSlug ? <Button size="sm" variant="secondary" onClick={() => router.push(`/${notification.creatorName}/${notification.assetSlug}`)}>Open Asset</Button> : null}
        {!notification.readAt ? <Button size="sm" variant="ghost" disabled={read.isPending} onClick={() => read.mutate()}>Mark Read</Button> : null}
      </div>
    </div>
  );
}

function AssetGrid({ assets, empty, onOpen }: { assets: WorkshopAsset[]; empty: string; onOpen?: (asset: WorkshopAsset) => void }) {
  const router = useRouter();
  if (!assets.length) return <div className="border border-border bg-card/40 p-4 text-sm text-muted-foreground">{empty}</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {assets.map((asset) => (
        <WorkshopAssetCard key={asset.id} asset={asset} onOpen={() => (onOpen ? onOpen(asset) : router.push(assetPath(asset)))} />
      ))}
    </div>
  );
}

function AssetActionCard({ asset, actions, onOpen }: { asset: WorkshopAsset; actions: ReactNode; onOpen: () => void }) {
  return (
    <div className="grid gap-2">
      <WorkshopAssetCard asset={asset} onOpen={onOpen} />
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

function DashboardSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-primary text-xl font-semibold uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function LoadingPanel() {
  return (
    <div className="grid min-h-64 place-items-center border border-border bg-card/40">
      <Spinner variant="primary" label="Loading" />
    </div>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid gap-1 border border-border bg-card/40 p-6">
      <h2 className="font-primary text-lg font-semibold uppercase">{title}</h2>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function NotificationDot() {
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" aria-hidden="true" />;
}

async function invalidateDashboard() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["workshop", "dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["workshop", "dashboard-comments"] }),
    queryClient.invalidateQueries({ queryKey: ["workshop", "notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["workshop", "featured-assets"] }),
  ]);
}

function parseMetadata(value: string) {
  try {
    return JSON.parse(value) as { assetTitle?: string; commentPreview?: string; displayName?: string };
  } catch {
    return {};
  }
}

function notificationLabel(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
