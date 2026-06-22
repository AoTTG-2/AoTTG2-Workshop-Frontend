"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, CommentBox, CommentSection, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, renderCommentMarkdown, type CommentItem } from "@aottg2/ui";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, Eye, Flag, Link as LinkIcon, MessageCircle, MoreHorizontal, Star, ThumbsUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAccessToken } from "../auth/storage";
import { useAuth } from "../auth/useAuth";
import { canModerateAssets, canModerateComments } from "../auth/workshopPermissions";
import { AssetTag, AssetTagLink } from "../components/AssetTag";
import { SideCard } from "../components/SideCard";
import { assetPath, createAssetComment, deleteWorkshopAsset, deleteWorkshopComment, getAsset, getAssetBySeoPath, hideModerationComment, listAssetComments, replyToAssetComment, reportWorkshopComment, setAssetFavorite, setAssetLike, trackAssetDownload, trackAssetView, type SkinPartPayload, type SkinSetItem, type SkinSetPayload, type WorkshopAsset, type WorkshopComment, type WorkshopMedia } from "../lib/api/workshop";
import { toast } from "../lib/toast";

const markdownComponents: Components = {
  h1: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h3: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h4: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h5: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  h6: ({ children }) => <h2 className="mt-6 font-primary text-2xl uppercase leading-none text-foreground first:mt-0">{children}</h2>,
  p: ({ children }) => <p className="mt-3 text-sm leading-6 text-muted-foreground">{children}</p>,
  a: ({ children, href }) => (
    <a className="font-semibold text-primary hover:underline" href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">{children}</ol>,
  blockquote: ({ children }) => <blockquote className="mt-4 border-l-2 border-primary/60 bg-muted/40 px-4 py-2 text-sm text-muted-foreground">{children}</blockquote>,
  code: ({ children }) => <code className="bg-muted px-1 py-0.5 text-xs text-foreground">{children}</code>,
  pre: ({ children }) => <pre className="mt-4 overflow-auto bg-muted p-3 text-xs text-foreground">{children}</pre>,
  table: ({ children }) => <table className="mt-4 w-full border-collapse border border-border text-sm text-muted-foreground">{children}</table>,
  th: ({ children }) => <th className="border border-border bg-muted px-3 py-2 text-left font-semibold text-foreground">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
  img: ({ alt, src }) => <img className="mt-4 max-h-[520px] w-full object-contain" src={src ?? ""} alt={alt ?? ""} loading="lazy" />,
};

interface AssetDetailProps {
  id?: string;
  creatorName?: string;
  assetSlug?: string;
  initialAsset?: WorkshopAsset;
}

export function AssetDetail({ id = "", creatorName = "", assetSlug = "", initialAsset }: AssetDetailProps = {}) {
  const router = useRouter();
  const seoLookup = creatorName && assetSlug ? { creatorName, assetSlug } : null;
  const query = useQuery({
    queryKey: ["workshop", "asset", seoLookup ?? id],
    queryFn: () => (seoLookup ? getAssetBySeoPath(seoLookup.creatorName, seoLookup.assetSlug, getAccessToken()) : getAsset(id, getAccessToken())),
    enabled: Boolean(seoLookup || id),
    initialData: initialAsset,
  });
  const asset = query.data;
  const refetchAsset = query.refetch;
  const trackedView = useRef<string | null>(null);

  useEffect(() => {
    if (asset && id) {
      const canonicalPath = assetPath(asset);
      if (canonicalPath !== `/library/${id}`) {
        router.replace(canonicalPath);
      }
    }
  }, [asset, id, router]);

  useEffect(() => {
    if (!asset?.id || trackedView.current === asset.id) return;
    trackedView.current = asset.id;
    void trackAssetView(asset.id, getAccessToken())
      .then((result) => {
        if (result.counted) void refetchAsset();
      })
      .catch(() => undefined);
  }, [asset?.id, refetchAsset]);

  if (query.isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 h-28 animate-pulse bg-muted" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="h-80 animate-pulse bg-muted" />
        </div>
      </main>
    );
  }

  if (query.isError || !asset) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" href="/library">
          Back to library
        </Link>
        <div className="mt-6 border border-border bg-card/40 p-6">
          <h1 className="font-primary text-3xl uppercase">Asset not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This asset could not be loaded.</p>
        </div>
      </main>
    );
  }

  return <AssetDetailContent asset={asset} onRefresh={() => refetchAsset()} />;
}

function AssetDetailContent({ asset, onRefresh }: { asset: WorkshopAsset; onRefresh: () => Promise<unknown> }) {
  const { isAuthenticated, profile, workshopUser } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const media = mediaForGallery(asset.media);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = media[activeIndex];
  const textureUrls = collectTextureUrls(asset);
  const category = assetCategory(asset);
  const summary = summarizeAsset(asset);
  const liked = Boolean(asset.viewerEngagement?.liked);
  const favorited = Boolean(asset.viewerEngagement?.favorited);
  const publicAssetUrl = `${typeof window === "undefined" ? "" : window.location.origin}${assetPath(asset)}`;
  const accountId = workshopUser?.authAccountId ?? profile?.accountId;
  const permissionSource = workshopUser ?? profile;
  const canDeleteAsset = isAuthenticated && (accountId === asset.ownerAuthAccountId || canModerateAssets(permissionSource));

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`, { description: "Copied to clipboard." });
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`, { description: "Clipboard access is unavailable or blocked." });
    }
  }

  function comingSoon(label: string) {
    toast.info(`${label} coming soon`, { description: "This action is not available yet." });
  }

  async function importAsset() {
    await copyText("asset JSON", JSON.stringify(asset.payload, null, 2));
    try {
      await trackAssetDownload(asset.id, getAccessToken());
      await onRefresh();
    } catch {
      // Import still worked; stats can refresh later.
    }
  }

  async function toggleLike() {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to thank assets.", { description: "Thanks are saved to your account." });
      return;
    }
    await setAssetLike(asset.id, !liked, token);
    await onRefresh();
  }

  async function toggleFavorite() {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to favorite assets.", { description: "Favorites are saved to your account." });
      return;
    }
    await setAssetFavorite(asset.id, !favorited, token);
    await onRefresh();
  }

  async function deleteAsset() {
    const token = getAccessToken();
    if (!token) {
      toast.info("Sign in required.", { description: "Your session may have expired." });
      return;
    }
    if (!window.confirm(`Delete "${asset.title}"?`)) return;
    try {
      await deleteWorkshopAsset(asset.publicId || asset.id, token);
      toast.success("Asset deleted", { description: "Removed from the Workshop library." });
      router.push("/library");
    } catch (error) {
      toast.error("Could not delete asset", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" href="/library">
        Back to library
      </Link>

      <motion.header className="mt-5 border-b border-border pb-5" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="font-primary text-balance text-4xl font-semibold uppercase leading-none tracking-tight">{asset.title}</h1>
            {asset.shortDescription ? <p className="mt-3 line-clamp-1 max-w-2xl text-base text-foreground">{asset.shortDescription}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase text-muted-foreground">
              <EngagementStat icon={<Download className="h-4 w-4" />} label="download" value={asset.engagement?.downloadCount ?? 0} />
              <EngagementStat icon={<ThumbsUp className="h-4 w-4" />} label="thank" value={asset.engagement?.likeCount ?? 0} />
              <EngagementStat icon={<Eye className="h-4 w-4" />} label="view" value={asset.engagement?.viewCount ?? 0} />
              <EngagementStat icon={<MessageCircle className="h-4 w-4" />} label="comment" value={asset.engagement?.commentCount ?? 0} />
            </div>
          </div>
          <TooltipProvider delayDuration={0} skipDelayDuration={0}>
            <div className="flex flex-wrap items-start gap-2 md:justify-end">
              <Button type="button" onClick={importAsset}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Import Asset
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className={`workshop-control-free group inline-flex items-center gap-2 px-2 py-1 text-lg font-semibold transition-colors hover:text-primary ${liked ? "text-primary" : "text-muted-foreground"}`} aria-label={liked ? "Remove thank" : "Thank"} onClick={() => void toggleLike()}>
                    <ThumbsUp className={`h-7 w-7 transition-colors ${liked ? "fill-current" : "fill-none group-hover:fill-current"}`} aria-hidden="true" />
                    {formatCount(asset.engagement?.likeCount ?? 0)}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{liked ? "Remove thank" : "Thank"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className={`workshop-control-free group inline-flex items-center px-2 py-1 transition-colors hover:text-yellow-400 ${favorited ? "text-yellow-400" : "text-muted-foreground"}`} aria-label={favorited ? "Unfavorite" : "Favorite"} onClick={() => void toggleFavorite()}>
                    <Star className={`h-7 w-7 transition-colors ${favorited ? "fill-current" : "fill-none group-hover:fill-current"}`} aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{favorited ? "Unfavorite" : "Favorite"}</TooltipContent>
              </Tooltip>
              <details className="group relative">
                <summary className="workshop-control-free flex h-10 min-h-10 cursor-pointer list-none items-center border border-border px-3 text-sm font-semibold uppercase text-muted-foreground hover:text-primary [&::-webkit-details-marker]:hidden" aria-label="More actions" title="More actions">
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </summary>
                <div className="absolute right-0 top-11 z-20 grid w-44 border border-border bg-popover p-1 text-popover-foreground shadow-md">
                  <MenuAction icon={<Copy className="h-4 w-4" />} label="Copy ID" onClick={() => copyText("asset id", asset.publicId)} />
                  <MenuAction icon={<LinkIcon className="h-4 w-4" />} label="Copy Link" onClick={() => copyText("asset link", publicAssetUrl)} />
                  <MenuAction icon={<Flag className="h-4 w-4" />} label="Report" onClick={() => comingSoon("Report")} />
                  {canDeleteAsset ? <MenuAction destructive icon={<Trash2 className="h-4 w-4" />} label="Delete Asset" onClick={deleteAsset} /> : null}
                </div>
              </details>
            </div>
          </TooltipProvider>
        </div>
      </motion.header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <motion.section className="min-w-0 space-y-5" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut", delay: reduceMotion ? 0 : 0.03 }}>
          <section className="border border-border bg-card/50 p-3">
            <GalleryImage media={activeMedia} title={asset.title} />
            {media.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {media.map((item, index) => (
                  <GalleryThumb key={`${item.url}-${index}`} item={item} title={asset.title} active={index === activeIndex} onClick={() => setActiveIndex(index)} />
                ))}
              </div>
            ) : null}
          </section>

          <section className="border border-border bg-card/50 p-5">
            {asset.descriptionMarkdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {asset.descriptionMarkdown}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )}
          </section>
        </motion.section>

        <motion.aside className="grid content-start gap-4" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut", delay: reduceMotion ? 0 : 0.06 }}>
          <SideCard title="Tags" variant="secondary">
            <div className="flex flex-wrap gap-2">
              <AssetTag variant="category" size="md">
                {formatLabel(category)}
              </AssetTag>
              {asset.tags.length > 0 ? (
                asset.tags.map((tag, index) => (
                  <AssetTagLink key={`${tag}-${index}`} size="md" href={`/library?tag=${encodeURIComponent(tag)}`}>
                    {tag}
                  </AssetTagLink>
                ))
              ) : (
                <AssetTag variant="empty" size="md">
                  No tags
                </AssetTag>
              )}
            </div>
          </SideCard>

          <SideCard title="Creator" variant="secondary">
            <div className="text-sm font-semibold text-foreground">{asset.authorDisplayName}</div>
            <div className="mt-1 text-xs text-muted-foreground">Owner</div>
          </SideCard>

          <SideCard title="Details" variant="secondary">
            <dl className="grid gap-2 text-sm">
              <SummaryRow label="Type" value={formatLabel(asset.type)} />
              <SummaryRow label="Category" value={formatLabel(category)} />
              <SummaryRow label="Summary" value={summary} />
              <SummaryRow label="Published" value={formatDate(asset.createdAt)} />
              <SummaryRow label="Updated" value={formatDate(asset.updatedAt)} />
            </dl>
          </SideCard>

          <SideCard title="Payload" variant="secondary">
            <AssetSummary asset={asset} />
            {textureUrls.length > 0 ? (
              <Button className="mt-3 w-full" type="button" variant="ghost" onClick={() => copyText("texture URLs", textureUrls.join("\n"))}>
                Copy Texture URLs
              </Button>
            ) : null}
          </SideCard>
        </motion.aside>
      </div>

      <AssetComments asset={asset} onAssetRefresh={onRefresh} />
    </main>
  );
}

function AssetComments({ asset, onAssetRefresh }: { asset: WorkshopAsset; onAssetRefresh: () => Promise<unknown> }) {
  const { isAuthenticated, profile, workshopUser } = useAuth();
  const reduceMotion = useReducedMotion();
  const accountId = workshopUser?.authAccountId ?? profile?.accountId;
  const permissionSource = workshopUser ?? profile;
  const assetCommentId = asset.publicId || asset.id;
  const commentsQuery = useQuery({
    queryKey: ["workshop", "asset-comments", assetCommentId],
    queryFn: () => listAssetComments(assetCommentId),
    enabled: Boolean(assetCommentId),
  });
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ commentId: string; rowId: string; author: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!replyTo) return;
    window.requestAnimationFrame(() => {
      document.getElementById(`reply-box-${replyTo.rowId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [replyTo]);

  function startReply(commentId: string, rowId: string, author: string) {
    setReplyTo({ commentId, rowId, author });
    setReplyBody(`@${author} `);
  }

  async function refreshAfterWrite() {
    await commentsQuery.refetch();
    await onAssetRefresh();
  }

  async function submitComment() {
    const token = getAccessToken();
    const text = body.trim();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to comment.", { description: "Comments are saved to your account." });
      return;
    }
    if (!text) {
      toast.error("Comment is empty.", { description: "Write something before posting." });
      return;
    }
    if (text.length > 1000) {
      toast.error("Comment is too long.", { description: "Keep comments under 1000 characters." });
      return;
    }

    try {
      setBusy(true);
      await createAssetComment(assetCommentId, text, token);
      setBody("");
      await refreshAfterWrite();
    } catch (error) {
      toast.error("Could not post comment", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function submitReply() {
    const token = getAccessToken();
    const text = replyBody.trim();
    if (!isAuthenticated || !token || !replyTo) return;
    if (!text) {
      toast.error("Reply is empty.", { description: "Write something before posting." });
      return;
    }
    if (text.length > 1000) {
      toast.error("Reply is too long.", { description: "Keep replies under 1000 characters." });
      return;
    }

    try {
      setBusy(true);
      await replyToAssetComment(assetCommentId, replyTo.commentId, text, token);
      setReplyBody("");
      setReplyTo(null);
      await refreshAfterWrite();
    } catch (error) {
      toast.error("Could not post reply", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteComment(commentId: string) {
    const token = getAccessToken();
    if (!token) {
      toast.info("Sign in required.", { description: "Your session may have expired." });
      return;
    }
    try {
      await deleteWorkshopComment(commentId, token);
      await refreshAfterWrite();
    } catch (error) {
      toast.error("Could not delete comment", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  async function reportComment(commentId: string) {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to report comments.", { description: "Reports are attached to your account." });
      return;
    }
    const reason = window.prompt("Reason for reporting this comment?", "spam")?.trim();
    if (!reason) return;
    try {
      await reportWorkshopComment(commentId, reason, token);
      toast.success("Comment reported", { description: "Moderators can review it now." });
    } catch (error) {
      toast.error("Could not report comment", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  async function hideComment(commentId: string) {
    const token = getAccessToken();
    if (!token) {
      toast.info("Sign in required.", { description: "Your session may have expired." });
      return;
    }
    try {
      await hideModerationComment(commentId, token);
      await refreshAfterWrite();
    } catch (error) {
      toast.error("Could not hide comment", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  function toItem(comment: WorkshopComment, parent = comment): CommentItem {
    const tombstone = comment.status === "deleted" || comment.status === "hidden";
    const canWrite = isAuthenticated && !tombstone;
    const actions = canWrite
      ? [
          { label: "Reply", onSelect: () => startReply(parent.id, comment.id, comment.authorDisplayName) },
          accountId === comment.authorAuthAccountId ? { label: "Delete", destructive: true, onSelect: () => void deleteComment(comment.id) } : null,
          canModerateComments(permissionSource) && comment.status === "visible" ? { label: "Hide", destructive: true, onSelect: () => void hideComment(comment.id) } : null,
          accountId !== comment.authorAuthAccountId ? { label: "Report", destructive: true, onSelect: () => void reportComment(comment.id) } : null,
        ].filter((item): item is NonNullable<typeof item> => item !== null)
      : undefined;

    return {
      id: comment.id,
      author: { name: comment.authorDisplayName },
      createdAt: formatDate(comment.createdAt),
      editedAt: comment.updatedAt !== comment.createdAt ? formatDate(comment.updatedAt) : undefined,
      body: renderCommentMarkdown(comment.body),
      deleted: tombstone,
      actions,
      replies: comment.replies.map((reply) => toItem(reply, comment)),
    };
  }

  const comments = commentsQuery.data?.comments.map((comment) => toItem(comment)) ?? [];

  return (
    <motion.section className="mt-5 border-t border-border pt-5" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut", delay: reduceMotion ? 0 : 0.08 }}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-primary text-2xl uppercase leading-none text-foreground">Comments</h2>
          <p className="mt-1 text-sm text-muted-foreground">{commentsQuery.data?.total ?? asset.engagement?.commentCount ?? 0} visible threads</p>
        </div>
        {!isAuthenticated ? <span className="text-sm text-muted-foreground">Sign in to comment or report.</span> : null}
      </div>

      <CommentBox
        value={body}
        onChange={setBody}
        onSubmit={() => void submitComment()}
        submitLabel="Comment"
        placeholder="Write a comment..."
        disabled={busy || !isAuthenticated}
        textareaProps={{ maxLength: 1000 }}
      />

      <div className="mt-4">
        <CommentSection
          comments={comments}
          empty={commentsQuery.isLoading ? "Loading comments..." : commentsQuery.isError ? "Comments could not be loaded." : "No comments yet."}
          renderBody={(comment) => (
            <>
              {comment.body}
              {replyTo?.rowId === comment.id ? (
                <motion.div initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: "easeOut" }}>
                  <CommentBox
                    id={`reply-box-${comment.id}`}
                    className="mt-3"
                    value={replyBody}
                    onChange={setReplyBody}
                    onSubmit={() => void submitReply()}
                    onCancel={() => { setReplyTo(null); setReplyBody(""); }}
                    submitLabel="Reply"
                    placeholder={`Reply to ${replyTo.author}...`}
                    disabled={busy}
                    textareaProps={{ maxLength: 1000 }}
                  />
                </motion.div>
              ) : null}
            </>
          )}
        />
      </div>
    </motion.section>
  );
}

function EngagementStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {formatCount(value)} {value === 1 ? label : `${label}s`}
    </span>
  );
}

function MenuAction({ icon, label, destructive = false, onClick }: { icon: ReactNode; label: string; destructive?: boolean; onClick: () => void | Promise<void> }) {
  return (
    <button type="button" role="menuitem" className={`workshop-control-free flex items-center gap-2 px-2 py-1.5 text-left text-sm font-semibold uppercase hover:bg-accent hover:text-accent-foreground ${destructive ? "text-destructive" : "text-muted-foreground"}`} onClick={() => void onClick()}>
      {icon}
      {label}
    </button>
  );
}

function AssetSummary({ asset }: { asset: WorkshopAsset }) {
  if (asset.type === "skin_part" && isSkinPartPayload(asset.payload)) {
    return (
      <dl className="grid gap-2 text-sm">
        <SummaryRow label="Slot" value={asset.payload.slot} />
        <SummaryRow label="Scope" value={asset.payload.variantScope} />
        <SummaryRow label="Variants" value={asset.payload.variants?.join(", ")} />
      </dl>
    );
  }

  if (asset.type === "skin_set" && isSkinSetPayload(asset.payload)) {
    return (
      <div className="grid gap-3 text-sm">
        {(asset.payload.items ?? []).map((item, index) => (
          <div key={`${item.slot}-${index}`} className="border-l border-border pl-3 text-muted-foreground">
            <div className="font-semibold text-foreground">Item {index + 1}: {item.slot ?? "Unknown slot"}</div>
            <div className="break-words">{summarizeSetItem(item)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="overflow-auto bg-muted p-3 text-xs text-foreground">{JSON.stringify(asset.payload, null, 2)}</pre>;
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd className="break-words text-foreground">{value}</dd>
    </div>
  );
}

function GalleryImage({ media, title }: { media?: WorkshopMedia; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [media?.url]);

  if (!media) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  if (failed) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return (
    <div className="relative aspect-video overflow-hidden bg-muted/50">
      {!loaded ? <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" /> : null}
      <img className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`} src={media.url} alt={media.description || title} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
    </div>
  );
}

function GalleryThumb({ item, title, active, onClick }: { item: WorkshopMedia; title: string; active: boolean; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [item.url]);

  return (
    <button type="button" className={`workshop-control-free relative aspect-video overflow-hidden border bg-muted/50 ${active ? "border-primary" : "border-border"}`} onClick={onClick}>
      {!loaded ? <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" /> : null}
      <img className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`} src={item.url} alt={item.description || title} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
    </button>
  );
}

function mediaForGallery(media: WorkshopMedia[]) {
  const unique = new Map<string, WorkshopMedia>();
  for (const item of media) {
    if (!unique.has(item.url)) unique.set(item.url, item);
  }
  return Array.from(unique.values());
}

function assetCategory(asset: WorkshopAsset) {
  if ((asset.type === "skin_part" || asset.type === "skin_set") && "category" in asset.payload && typeof asset.payload.category === "string") {
    return asset.payload.category;
  }

  return asset.type;
}

function summarizeAsset(asset: WorkshopAsset) {
  if (asset.type === "skin_part" && isSkinPartPayload(asset.payload)) {
    const variants = asset.payload.variantScope === "specific" && asset.payload.variants?.length ? `: ${asset.payload.variants.join(", ")}` : "";
    return `${asset.payload.slot ?? "Skin part"}${variants}`;
  }

  if (asset.type === "skin_set" && isSkinSetPayload(asset.payload)) {
    const count = asset.payload.items?.length ?? 0;
    return `${count} set ${count === 1 ? "item" : "items"}`;
  }

  return formatLabel(asset.type);
}

function collectTextureUrls(asset: WorkshopAsset) {
  if (asset.type === "skin_part" && isSkinPartPayload(asset.payload)) {
    return asset.payload.textureUrl ? [asset.payload.textureUrl] : [];
  }

  if (asset.type === "skin_set" && isSkinSetPayload(asset.payload)) {
    return (asset.payload.items ?? []).map((item) => item.textureUrl).filter((url): url is string => Boolean(url));
  }

  return [];
}

function summarizeSetItem(item: SkinSetItem) {
  const source = item.skinAssetId ? `references ${item.skinAssetId}` : item.textureUrl ? item.textureUrl : "no texture";
  const variants = item.variantScope === "specific" && item.variants?.length ? ` - ${item.variants.join(", ")}` : "";
  return `${source}${variants}`;
}

function isSkinPartPayload(payload: WorkshopAsset["payload"]): payload is SkinPartPayload {
  return "slot" in payload || "textureUrl" in payload;
}

function isSkinSetPayload(payload: WorkshopAsset["payload"]): payload is SkinSetPayload {
  return "items" in payload;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}
