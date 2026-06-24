"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, CommentBox, CommentSection, Spinner, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, type CommentItem } from "@aottg2/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight, Copy, Download, Eye, Flag, Link as LinkIcon, MessageCircle, MoreHorizontal, Pencil, Star, ThumbsUp, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi, authAssetUrl } from "../auth/api";
import { getAccessToken } from "../auth/storage";
import type { ProfilePreset } from "../auth/types";
import { useAuth } from "../auth/useAuth";
import { canModerateAssets, canModerateComments } from "../auth/workshopPermissions";
import { AssetTag, AssetTagLink } from "../components/AssetTag";
import { CreatorIdentityLink, CreatorMention } from "../components/CreatorIdentityLink";
import { ReportDialog } from "../components/ReportDialog";
import { SideCard } from "../components/SideCard";
import { assetPath, createAssetComment, deleteWorkshopAsset, deleteWorkshopComment, getAsset, getAssetBySeoPath, hideModerationComment, listAssetComments, listAssetUsedBy, replyToAssetComment, reportWorkshopAsset, reportWorkshopComment, setAssetFavorite, setAssetLike, trackAssetDownload, trackAssetView, type SkinPartPayload, type SkinSetItem, type SkinSetPayload, type WorkshopAsset, type WorkshopComment, type WorkshopMedia } from "../lib/api/workshop";
import { thumbnailDisplayUrls } from "../lib/media";
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
    if (!asset?.id || asset.status !== "visible" || trackedView.current === asset.id) return;
    trackedView.current = asset.id;
    void trackAssetView(asset.id, getAccessToken())
      .then((result) => {
        if (result.counted) void refetchAsset();
      })
      .catch(() => undefined);
  }, [asset?.id, asset?.status, refetchAsset]);

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

function AssetDetailContent({ asset: sourceAsset, onRefresh }: { asset: WorkshopAsset; onRefresh: () => Promise<unknown> }) {
  const [displayAsset, setDisplayAsset] = useState(sourceAsset);
  const { isAuthenticated, profile, workshopUser } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const asset = displayAsset;
  const media = mediaForGallery(asset.media);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryDirection, setGalleryDirection] = useState(1);
  const [likeBurst, setLikeBurst] = useState(false);
  const [favoriteBurst, setFavoriteBurst] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const activeMedia = media[activeIndex];
  const textureUrls = collectTextureUrls(asset);
  const category = assetCategory(asset);
  const summary = summarizeAsset(asset);
  const liked = Boolean(asset.viewerEngagement?.liked);
  const favorited = Boolean(asset.viewerEngagement?.favorited);
  const publicAssetUrl = `${typeof window === "undefined" ? "" : window.location.origin}${assetPath(asset)}`;
  const accountId = workshopUser?.authAccountId ?? profile?.accountId;
  const permissionSource = workshopUser ?? profile;
  const isOwnAsset = Boolean(accountId && accountId === asset.ownerAuthAccountId);
  const canEditAsset = isAuthenticated && (isOwnAsset || canModerateAssets(permissionSource));
  const canDeleteAsset = canEditAsset;
  const usedByQuery = useQuery({
    queryKey: ["workshop", "asset-used-by", asset.publicId || asset.id],
    queryFn: () => listAssetUsedBy(asset.publicId || asset.id, getAccessToken()),
    enabled: asset.type === "skin_part",
  });
  const usedByAssets = usedByQuery.data?.assets ?? [];

  useEffect(() => setDisplayAsset(sourceAsset), [sourceAsset]);

  useEffect(() => {
    if (activeIndex >= media.length) setActiveIndex(0);
  }, [activeIndex, media.length]);

  function selectGalleryImage(index: number) {
    if (index === activeIndex) return;
    setGalleryDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  }

  function moveGallery(offset: number) {
    setGalleryDirection(offset > 0 ? 1 : -1);
    setActiveIndex((current) => (current + offset + media.length) % media.length);
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`, { description: "Copied to clipboard." });
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`, { description: "Clipboard access is unavailable or blocked." });
    }
  }

  async function submitAssetReport(reason: string, details: string | null) {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to report assets.", { description: "Reports are attached to your account." });
      return;
    }
    try {
      setReportBusy(true);
      await reportWorkshopAsset(asset.publicId || asset.id, reason, details, token);
      toast.success("Asset reported", { description: "Moderators can review it now." });
      setReportOpen(false);
    } catch (error) {
      toast.error("Could not report asset", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setReportBusy(false);
    }
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
    if (isOwnAsset) {
      toast.info("You can't thank your own asset.", { description: "Thanks are for other creators' assets." });
      return;
    }
    const nextLiked = !liked;
    replayReaction(setLikeBurst);
    const previousAsset = asset;
    setDisplayAsset((current) => optimisticEngagement(current, "likeCount", "liked", nextLiked));
    try {
      const result = await setAssetLike(asset.publicId || asset.id, nextLiked, token);
      setDisplayAsset((current) => ({ ...current, engagement: result.engagement, viewerEngagement: result.viewerEngagement ?? current.viewerEngagement }));
      toast.success(nextLiked ? `Sent Thanks to ${asset.title}` : `Removed Thanks from ${asset.title}`, { description: nextLiked ? "Thanks sent." : "Thanks removed." });
    } catch (error) {
      setDisplayAsset(previousAsset);
      toast.error("Could not update Thanks", { description: error instanceof Error ? error.message : "Try again." });
    }
  }

  async function toggleFavorite() {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to favorite assets.", { description: "Favorites are saved to your account." });
      return;
    }
    const nextFavorited = !favorited;
    replayReaction(setFavoriteBurst);
    const previousAsset = asset;
    setDisplayAsset((current) => optimisticEngagement(current, "favoriteCount", "favorited", nextFavorited));
    try {
      const result = await setAssetFavorite(asset.publicId || asset.id, nextFavorited, token);
      setDisplayAsset((current) => ({ ...current, engagement: result.engagement, viewerEngagement: result.viewerEngagement ?? current.viewerEngagement }));
      toast.success(nextFavorited ? `Favourited ${asset.title}` : `Removed favourite from ${asset.title}`, { description: nextFavorited ? "Saved to favourites." : "Removed from favourites." });
    } catch (error) {
      setDisplayAsset(previousAsset);
      toast.error("Could not update favourite", { description: error instanceof Error ? error.message : "Try again." });
    }
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

  if (asset.status !== "visible") {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" href="/library">
          Back to library
        </Link>
        <div className="mt-6 border border-border bg-card/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-primary text-3xl uppercase">{asset.title}</h1>
            <AssetTag variant="category">{asset.status}</AssetTag>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{isOwnAsset || canModerateAssets(permissionSource) ? "This asset is hidden from the public." : "This asset is unavailable."}</p>
          {canModerateAssets(permissionSource) ? (
            <Button className="mt-5" type="button" onClick={() => router.push("/moderation")}>
              Open Moderation
            </Button>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <motion.div initial={motionInitial(reduceMotion, 6)} animate={motionAnimate} transition={motionTransition(0)}>
        <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" href="/library">
          Back to library
        </Link>
      </motion.div>

      <motion.header className="mt-5 border-b border-border pb-5" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.03)}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="font-primary text-balance text-4xl font-semibold uppercase leading-none tracking-tight">{asset.title}</h1>
            {asset.shortDescription ? <p className="mt-3 line-clamp-1 max-w-2xl text-base text-foreground">{asset.shortDescription}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase text-muted-foreground">
              <EngagementStat icon={<Download className="h-4 w-4" />} label="download" value={asset.engagement?.downloadCount ?? 0} />
              <EngagementStat icon={<ThumbsUp className="h-4 w-4" />} label="Thanks" value={asset.engagement?.likeCount ?? 0} />
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
                  <motion.button type="button" className={`workshop-control-free workshop-reaction-button group ml-3 inline-flex items-center gap-2 px-2 py-1 text-lg font-semibold hover:text-primary hover:drop-shadow-[0_0_8px_currentColor] ${liked ? "text-primary drop-shadow-[0_0_8px_currentColor]" : "text-muted-foreground"}`} aria-label={liked ? "Remove Thanks" : "Send Thanks"} whileTap={reactionTap(reduceMotion)} animate={reactionBurst(likeBurst, reduceMotion)} transition={reactionTransition} onClick={() => void toggleLike()} onAnimationComplete={() => setLikeBurst(false)}>
                    <ThumbsUp className="workshop-reaction-icon h-7 w-7 fill-none transition-colors" aria-hidden="true" />
                    {formatCount(asset.engagement?.likeCount ?? 0)}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>{liked ? "Remove Thanks" : "Send Thanks"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button type="button" className={`workshop-control-free workshop-reaction-button group inline-flex items-center px-2 py-1 hover:text-yellow-400 hover:drop-shadow-[0_0_8px_currentColor] ${favorited ? "text-yellow-400 drop-shadow-[0_0_8px_currentColor]" : "text-muted-foreground"}`} aria-label={favorited ? "Unfavorite" : "Favorite"} whileTap={reactionTap(reduceMotion)} animate={reactionBurst(favoriteBurst, reduceMotion)} transition={reactionTransition} onClick={() => void toggleFavorite()} onAnimationComplete={() => setFavoriteBurst(false)}>
                    <Star className={`workshop-reaction-icon h-7 w-7 transition-colors ${favorited ? "fill-current" : "fill-none group-hover:fill-current"}`} aria-hidden="true" />
                  </motion.button>
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
                  {canEditAsset ? <MenuAction icon={<Pencil className="h-4 w-4" />} label="Edit Asset" onClick={() => router.push(`${assetPath(asset)}/edit`)} /> : null}
                  {!isOwnAsset ? <MenuAction icon={<Flag className="h-4 w-4" />} label="Report" onClick={() => setReportOpen(true)} /> : null}
                  {canDeleteAsset ? <MenuAction destructive icon={<Trash2 className="h-4 w-4" />} label="Delete Asset" onClick={deleteAsset} /> : null}
                </div>
              </details>
            </div>
          </TooltipProvider>
        </div>
      </motion.header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <motion.section className="min-w-0 space-y-5" initial={motionInitial(reduceMotion, 10)} animate={motionAnimate} transition={motionTransition(0.06)}>
          <motion.section className="workshop-gallery-card border border-border bg-card/50 p-3" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.09)}>
            <GalleryImage media={activeMedia} title={asset.title} direction={galleryDirection} reduceMotion={reduceMotion} />
            {media.length > 1 ? (
              <div className="workshop-gallery-rail mt-3">
                <GalleryNavButton label="Previous image" onClick={() => moveGallery(-1)}>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </GalleryNavButton>
                <div className="workshop-gallery-thumbs">
                  {media.map((item, index) => (
                    <motion.div key={`${item.url}-${index}`} initial={motionInitial(reduceMotion, 6)} animate={motionAnimate} transition={motionTransition(0.12 + Math.min(index, 8) * 0.02)}>
                      <GalleryThumb item={item} title={asset.title} active={index === activeIndex} onClick={() => selectGalleryImage(index)} />
                    </motion.div>
                  ))}
                </div>
                <GalleryNavButton label="Next image" onClick={() => moveGallery(1)}>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </GalleryNavButton>
              </div>
            ) : null}
          </motion.section>

          <motion.section className="border border-border bg-card/50 p-5" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.13)}>
            {asset.descriptionMarkdown ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {asset.descriptionMarkdown}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )}
          </motion.section>
        </motion.section>

        <motion.aside className="grid content-start gap-4" initial={motionInitial(reduceMotion, 10)} animate={motionAnimate} transition={motionTransition(0.08)}>
          <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.11)}>
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
          </motion.div>

          <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.14)}>
            <SideCard title="Created By" variant="secondary">
              <CreatorIdentityLink
                displayName={asset.authorDisplayName}
                creatorName={asset.authorCreatorName ?? asset.creatorName}
                avatarKey={asset.authorAvatarKey}
              />
            </SideCard>
          </motion.div>

          <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.17)}>
            <SideCard title="Details" variant="secondary">
              <dl className="grid gap-2 text-sm">
                <SummaryRow label="Type" value={formatLabel(asset.type)} />
                <SummaryRow label="Category" value={formatLabel(category)} />
                <SummaryRow label="Summary" value={summary} />
                <SummaryRow label="Published" value={formatDate(asset.createdAt)} />
                <SummaryRow label="Updated" value={formatDate(asset.updatedAt)} />
              </dl>
            </SideCard>
          </motion.div>

          {usedByAssets.length > 0 ? (
            <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.19)}>
              <UsedBySetsCard assets={usedByAssets} />
            </motion.div>
          ) : null}

          <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.2)}>
            <SideCard title="Payload" variant="secondary">
              <AssetSummary asset={asset} />
              {textureUrls.length > 0 ? (
                <Button className="mt-3 w-full" type="button" variant="ghost" onClick={() => copyText("texture URLs", textureUrls.join("\n"))}>
                  Copy Texture URLs
                </Button>
              ) : null}
            </SideCard>
          </motion.div>
        </motion.aside>
      </div>

      <AssetComments asset={asset} onAssetRefresh={onRefresh} />
      <ReportDialog open={reportOpen} title="Report Asset" description="Send this asset to the moderation queue." busy={reportBusy} onOpenChange={setReportOpen} onSubmit={submitAssetReport} />
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
  const rawComments = useMemo(() => commentsQuery.data?.comments ?? [], [commentsQuery.data?.comments]);
  const needsAvatars = rawComments.some(hasAvatarKey);
  const presetsQuery = useQuery({
    queryKey: ["auth", "profile-presets"],
    queryFn: async () => {
      const result = await authApi.getProfilePresets();
      if (!result.ok) throw new Error(result.data.error ?? "Failed to load profile presets");
      return result.data;
    },
    enabled: needsAvatars,
    staleTime: 60 * 60 * 1000,
  });
  const avatarByKey = useMemo(() => new Map((presetsQuery.data?.avatars ?? []).map((preset) => [preset.key, preset])), [presetsQuery.data?.avatars]);
  const mentionAuthors = useMemo(() => collectMentionAuthors(rawComments), [rawComments]);
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ commentId: string; rowId: string; author: string } | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

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

  async function submitCommentReport(reason: string, details: string | null) {
    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to report comments.", { description: "Reports are attached to your account." });
      return;
    }
    if (!reportCommentId) return;
    try {
      setReportBusy(true);
      await reportWorkshopComment(reportCommentId, reason, details, token);
      toast.success("Comment reported", { description: "Moderators can review it now." });
      setReportCommentId(null);
    } catch (error) {
      toast.error("Could not report comment", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setReportBusy(false);
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
    const avatarUrl = presetImageUrl(comment.authorAvatarKey ? avatarByKey.get(comment.authorAvatarKey) : undefined);
    const actions = canWrite
      ? [
          { label: "Reply", onSelect: () => startReply(parent.id, comment.id, comment.authorDisplayName) },
          accountId === comment.authorAuthAccountId ? { label: "Delete", destructive: true, onSelect: () => void deleteComment(comment.id) } : null,
          canModerateComments(permissionSource) && comment.status === "visible" ? { label: "Hide", destructive: true, onSelect: () => void hideComment(comment.id) } : null,
          accountId !== comment.authorAuthAccountId ? { label: "Report", destructive: true, onSelect: () => setReportCommentId(comment.id) } : null,
        ].filter((item): item is NonNullable<typeof item> => item !== null)
      : undefined;

    return {
      id: comment.id,
      author: {
        name: <CreatorMention displayName={comment.authorDisplayName} creatorName={comment.authorCreatorName}>{comment.authorDisplayName}</CreatorMention>,
        avatarUrl,
        fallback: initials(comment.authorDisplayName),
      },
      createdAt: formatDate(comment.createdAt),
      editedAt: comment.updatedAt !== comment.createdAt ? formatDate(comment.updatedAt) : undefined,
      body: renderCommentMarkdownWithMentions(comment.body, mentionAuthors),
      deleted: tombstone,
      actions,
      replies: comment.replies.map((reply) => toItem(reply, comment)),
    };
  }

  const comments = rawComments.map((comment) => toItem(comment));

  return (
    <>
    <motion.section className="mt-5 border-t border-border pt-5" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.1)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-primary text-2xl uppercase leading-none text-foreground">Comments</h2>
          <p className="mt-1 text-sm text-muted-foreground">{commentsQuery.data?.total ?? asset.engagement?.commentCount ?? 0} visible threads</p>
        </div>
        {!isAuthenticated ? <span className="text-sm text-muted-foreground">Sign in to comment or report.</span> : null}
      </div>

      <motion.div initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.13)}>
        <CommentBox
          value={body}
          onChange={setBody}
          onSubmit={() => void submitComment()}
          submitLabel="Comment"
          placeholder="Write a comment..."
          disabled={busy || !isAuthenticated}
          textareaProps={{ maxLength: 1000 }}
        />
      </motion.div>

      <motion.div className="mt-4" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.16)}>
        <CommentSection
          className="workshop-comment-stagger"
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
      </motion.div>
    </motion.section>
    <ReportDialog open={Boolean(reportCommentId)} title="Report Comment" description="Send this comment to the moderation queue." busy={reportBusy} onOpenChange={(open) => !open && setReportCommentId(null)} onSubmit={submitCommentReport} />
    </>
  );
}

interface MentionAuthor {
  displayName: string;
  creatorName?: string | null;
}

function hasAvatarKey(comment: WorkshopComment): boolean {
  return Boolean(comment.authorAvatarKey) || comment.replies.some(hasAvatarKey);
}

function collectMentionAuthors(comments: WorkshopComment[]) {
  const authors = new Map<string, MentionAuthor>();
  function visit(comment: WorkshopComment) {
    if (comment.status === "visible" && comment.authorDisplayName && comment.authorDisplayName !== "[deleted]") {
      const key = comment.authorDisplayName.toLowerCase();
      if (!authors.has(key)) authors.set(key, { displayName: comment.authorDisplayName, creatorName: comment.authorCreatorName });
    }
    comment.replies.forEach(visit);
  }
  comments.forEach(visit);
  return [...authors.values()];
}

function renderCommentMarkdownWithMentions(value: string, mentions: MentionAuthor[]) {
  if (!value.trim()) return <span className="text-muted-foreground">Nothing to preview.</span>;
  return value.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
    <p className="mb-2 last:mb-0" key={paragraphIndex}>
      {paragraph.split("\n").map((line, lineIndex, lines) => (
        <span key={lineIndex}>
          {renderInlineCommentMarkdown(line, mentions)}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  ));
}

function renderInlineCommentMarkdown(value: string, mentions: MentionAuthor[]) {
  const tokens = [
    { regex: /^`([^`]+)`/, render: (match: RegExpExecArray, key: string) => <code className="bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground" key={key}>{match[1]}</code> },
    { regex: /^\[([^\]]+)\]\(([^)]+)\)/, render: (match: RegExpExecArray, key: string) => <a className="font-medium text-primary underline underline-offset-4" href={safeCommentUrl(match[2])} key={key} rel="noreferrer" target="_blank">{match[1]}</a> },
    { regex: /^\*\*([^*]+)\*\*/, render: (match: RegExpExecArray, key: string) => <strong className="font-semibold text-foreground" key={key}>{match[1]}</strong> },
    { regex: /^~~([^~]+)~~/, render: (match: RegExpExecArray, key: string) => <del key={key}>{match[1]}</del> },
    { regex: /^\*([^*]+)\*/, render: (match: RegExpExecArray, key: string) => <em key={key}>{match[1]}</em> },
  ];
  const output: ReactNode[] = [];
  let rest = value;
  let index = 0;
  while (rest.length) {
    const token = tokens.find((item) => item.regex.test(rest));
    const match = token?.regex.exec(rest);
    if (token && match) {
      output.push(token.render(match, `token-${index}`));
      rest = rest.slice(match[0].length);
      index += 1;
      continue;
    }
    const nextSpecial = rest.slice(1).search(/[`*~[]/) + 1;
    const take = nextSpecial > 0 ? nextSpecial : rest.length;
    output.push(...linkCommentMentions(rest.slice(0, take), mentions, index));
    rest = rest.slice(take);
    index += 1;
  }
  return output;
}

function linkCommentMentions(text: string, mentions: MentionAuthor[], keyStart: number) {
  const names = mentions.map((mention) => mention.displayName).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!names.length) return [text];
  const byName = new Map(mentions.map((mention) => [mention.displayName.toLowerCase(), mention]));
  const regex = new RegExp(`@(${names.map(escapeRegex).join("|")})(?=$|[\\s.,!?;:)\\]])`, "gi");
  const output: ReactNode[] = [];
  let lastIndex = 0;
  let tokenIndex = keyStart;
  for (const match of text.matchAll(regex)) {
    if (match.index === undefined) continue;
    if (match.index > lastIndex) output.push(text.slice(lastIndex, match.index));
    const mention = byName.get(match[1].toLowerCase());
    output.push(
      <CreatorMention key={`mention-${tokenIndex}`} displayName={match[1]} creatorName={mention?.creatorName}>
        @{match[1]}
      </CreatorMention>,
    );
    lastIndex = match.index + match[0].length;
    tokenIndex += 1;
  }
  if (lastIndex < text.length) output.push(text.slice(lastIndex));
  return output.length ? output : [text];
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeCommentUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : "#";
}

function presetImageUrl(preset?: ProfilePreset) {
  return preset?.imageUrl ? authAssetUrl(preset.imageUrl) : undefined;
}

function initials(value: string) {
  return value.trim().slice(0, 2).toUpperCase() || "?";
}

function EngagementStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {formatCount(value)} {label === "Thanks" ? "Thanks" : value === 1 ? label : `${label}s`}
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
        {asset.payload.slot === "Costume" ? <SummaryRow label="Boots" value={asset.payload.boots === false ? "Off" : "On"} /> : null}
      </dl>
    );
  }

  if (asset.type === "skin_set" && isSkinSetPayload(asset.payload)) {
    return (
      <div className="grid gap-3 text-sm">
        {(asset.payload.items ?? []).map((item, index) => (
          <div key={`${item.slot}-${index}`} className="border-l border-border pl-3 text-muted-foreground">
            <div className="font-semibold text-foreground">Item {index + 1}: {item.slot ?? "Unknown slot"}</div>
            <SetItemSummary item={item} />
          </div>
        ))}
      </div>
    );
  }

  return <pre className="overflow-auto bg-muted p-3 text-xs text-foreground">{JSON.stringify(asset.payload, null, 2)}</pre>;
}

function UsedBySetsCard({ assets }: { assets: WorkshopAsset[] }) {
  return (
    <SideCard title="Used In Sets" variant="secondary">
      <div className="grid gap-2">
        {assets.map((asset) => (
          <Link key={asset.id} className="group border border-border bg-muted/30 p-3 hover:border-primary/70 hover:bg-muted/50" href={assetPath(asset)}>
            <span className="block truncate font-primary text-sm font-semibold uppercase text-foreground group-hover:text-primary">{asset.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">by {asset.authorDisplayName}</span>
          </Link>
        ))}
      </div>
    </SideCard>
  );
}

function SetItemSummary({ item }: { item: SkinSetItem }) {
  const details = summarizeSetItemDetails(item);
  return (
    <div className="break-words">
      {item.skinAssetId ? (
        <Link className="font-semibold text-primary hover:underline" href={`/library/${encodeURIComponent(item.skinAssetId)}`}>
          Linked skin part
        </Link>
      ) : (
        <span>{item.textureUrl || "no texture"}</span>
      )}
      {details ? <span>{details}</span> : null}
    </div>
  );
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

function GalleryImage({ media, title, direction, reduceMotion }: { media?: WorkshopMedia; title: string; direction: number; reduceMotion: boolean | null }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setSourceIndex(0);
  }, [media?.url]);

  if (!media) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  if (failed) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  const sources = thumbnailDisplayUrls(media.url, { width: 960, height: 540, fit: "inside" });

  return (
    <div className="workshop-gallery-image relative aspect-video overflow-hidden bg-muted/50">
      {!loaded ? <ThumbnailLoading /> : null}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.img
          key={`${media.url}-${sourceIndex}`}
          className="absolute inset-0 h-full w-full object-contain"
          src={sources[sourceIndex]}
          alt={media.description || title}
          custom={direction}
          initial={reduceMotion ? false : { opacity: 0, x: direction * 24, scale: 0.985 }}
          animate={{ opacity: loaded ? 1 : 0, x: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -20, scale: 0.99 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          ref={(image) => {
            if (image?.complete && image.naturalWidth > 0 && !loaded) setLoaded(true);
          }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setLoaded(false);
              setSourceIndex((index) => index + 1);
              return;
            }
            setFailed(true);
          }}
        />
      </AnimatePresence>
    </div>
  );
}

function GalleryThumb({ item, title, active, onClick }: { item: WorkshopMedia; title: string; active: boolean; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setSourceIndex(0);
  }, [item.url]);

  const sources = thumbnailDisplayUrls(item.url, { width: 180, height: 101, fit: "cover" });

  return (
    <button type="button" className={`workshop-control-free workshop-gallery-thumb relative aspect-video overflow-hidden bg-muted/50 ${active ? "is-active" : ""}`} aria-current={active ? "true" : undefined} onClick={onClick}>
      {!loaded ? <div className="absolute inset-0 grid place-items-center bg-muted/50"><Spinner size="sm" variant="primary" label="Loading thumbnail" /></div> : null}
      <img
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`}
        src={sources[sourceIndex]}
        alt={item.description || title}
        loading="lazy"
        ref={(image) => {
          if (image?.complete && image.naturalWidth > 0 && !loaded) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (sourceIndex < sources.length - 1) {
            setLoaded(false);
            setSourceIndex((index) => index + 1);
            return;
          }
          setLoaded(true);
        }}
      />
    </button>
  );
}

function GalleryNavButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" className="workshop-control-free workshop-gallery-nav" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function ThumbnailLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-muted/50">
      <div className="flex animate-pulse items-center gap-2 font-primary text-xs font-semibold uppercase text-muted-foreground">
        <Spinner size="sm" variant="primary" label="Loading thumbnail" />
      </div>
    </div>
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
    const boots = asset.payload.slot === "Costume" ? ` - Boots ${asset.payload.boots === false ? "Off" : "On"}` : "";
    return `${asset.payload.slot ?? "Skin part"}${variants}${boots}`;
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

function summarizeSetItemDetails(item: SkinSetItem) {
  const variants = item.variantScope === "specific" && item.variants?.length ? ` - ${item.variants.join(", ")}` : "";
  const boots = item.slot === "Costume" ? ` - Boots ${item.boots === false ? "Off" : "On"}` : "";
  return `${variants}${boots}`;
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

function optimisticEngagement(asset: WorkshopAsset, countKey: "likeCount" | "favoriteCount", viewerKey: "liked" | "favorited", enabled: boolean): WorkshopAsset {
  const engagement = asset.engagement ?? { likeCount: 0, favoriteCount: 0, viewCount: 0, downloadCount: 0, commentCount: 0 };
  const wasEnabled = Boolean(asset.viewerEngagement?.[viewerKey]);
  const delta = enabled === wasEnabled ? 0 : enabled ? 1 : -1;
  return {
    ...asset,
    engagement: { ...engagement, [countKey]: Math.max(0, engagement[countKey] + delta) },
    viewerEngagement: { liked: Boolean(asset.viewerEngagement?.liked), favorited: Boolean(asset.viewerEngagement?.favorited), [viewerKey]: enabled },
  };
}

const motionAnimate = { opacity: 1, y: 0 };

function motionInitial(reduceMotion: boolean | null, y: number) {
  return reduceMotion ? false : { opacity: 0, y };
}

function motionTransition(delay: number) {
  return { duration: 0.18, ease: "easeOut" as const, delay };
}

const reactionTransition = { duration: 0.46, ease: "easeOut" as const };

function reactionTap(reduceMotion: boolean | null) {
  return reduceMotion ? undefined : { scale: 0.82, rotate: -4 };
}

function reactionBurst(active: boolean, reduceMotion: boolean | null) {
  if (reduceMotion || !active) return { scale: 1, rotate: 0 };
  return { scale: [1, 0.82, 1.18, 0.96, 1.04, 1], rotate: [0, -7, 7, -4, 3, 0] };
}

function replayReaction(setBurst: (value: boolean) => void) {
  setBurst(false);
  window.requestAnimationFrame(() => setBurst(true));
}
