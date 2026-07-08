"use client";

import { Spinner, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@aottg2/ui";
import { CalendarDays, Download, ThumbsUp } from "lucide-react";
import { type ElementRef, type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { getAccessToken } from "../auth/storage";
import { useAuth } from "../auth/useAuth";
import { AssetTag, AssetTagButton } from "./AssetTag";
import { CreatorIdentityLink } from "./CreatorIdentityLink";
import { optimisticEngagement } from "../features/asset-detail/engagement";
import { assetCategory, summarizeAsset } from "../features/asset-detail/summary";
import { setAssetLike, type WorkshopAsset, type WorkshopMedia } from "../lib/api/workshop";
import { thumbnailDisplayUrls } from "../lib/media";
import { toast } from "../lib/toast";
import { assetTypeLabel } from "../lib/workshop/taxonomy";

interface WorkshopAssetCardProps {
  asset: WorkshopAsset;
  interactive?: boolean;
  quickThanks?: boolean;
  onOpen?: () => void;
  onTagSelect?: (tag: string) => void;
}

export function WorkshopAssetCard({ asset: sourceAsset, interactive = true, quickThanks = true, onOpen, onTagSelect }: WorkshopAssetCardProps) {
  const [asset, setAsset] = useState(sourceAsset);
  const [thanksBusy, setThanksBusy] = useState(false);
  const { isAuthenticated, profile, workshopUser } = useAuth();
  const thumbnail = selectPreview(asset.media);
  const category = assetCategory(asset);
  const canOpen = interactive && Boolean(onOpen);
  const canQuickThank = interactive && quickThanks;
  const liked = Boolean(asset.viewerEngagement?.liked);
  const accountId = workshopUser?.authAccountId ?? profile?.accountId;
  const isOwnAsset = Boolean(accountId && accountId === asset.ownerAuthAccountId);

  useEffect(() => {
    setAsset(sourceAsset);
  }, [sourceAsset]);

  function openAsset() {
    if (canOpen) onOpen?.();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!canOpen || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openAsset();
  }

  function handleTagClick(event: MouseEvent, assetTag: string) {
    event.stopPropagation();
    onTagSelect?.(assetTag);
  }

  async function handleThanksClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!canQuickThank || thanksBusy) return;

    const token = getAccessToken();
    if (!isAuthenticated || !token) {
      toast.info("Sign in to thank assets.", { description: "Thanks are saved to your account." });
      return;
    }
    if (isOwnAsset) {
      toast.info("You can't thank your own asset.", { description: "Thanks are for other creators' assets." });
      return;
    }

    const previousAsset = asset;
    const nextLiked = !liked;
    setThanksBusy(true);
    setAsset((current) => optimisticEngagement(current, "likeCount", "liked", nextLiked));
    try {
      const result = await setAssetLike(asset.publicId || asset.id, nextLiked, token);
      setAsset((current) => ({ ...current, engagement: result.engagement, viewerEngagement: result.viewerEngagement ?? current.viewerEngagement }));
    } catch (error) {
      setAsset(previousAsset);
      toast.error("Could not update Thanks", { description: error instanceof Error ? error.message : "Try again." });
    } finally {
      setThanksBusy(false);
    }
  }

  return (
    <article
      className={`workshop-hover-card grid overflow-visible border border-border bg-card/60 ${canOpen ? "cursor-pointer" : ""}`}
      role={canOpen ? "link" : undefined}
      tabIndex={canOpen ? 0 : undefined}
      aria-label={canOpen ? `View ${asset.title}` : undefined}
      onClick={canOpen ? openAsset : undefined}
      onKeyDown={canOpen ? handleKeyDown : undefined}
    >
      <PreviewImage media={thumbnail} title={asset.title} />
      <div className="flex min-h-56 min-w-0 flex-col gap-2 overflow-hidden p-3">
        <div className="flex min-w-0 items-baseline gap-1 text-sm text-foreground">
          <div className="min-w-0 flex-[1_1_0] overflow-hidden">
            <TooltipProvider delayDuration={150} skipDelayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="workshop-card-title block w-full truncate font-primary font-semibold uppercase" tabIndex={0}>
                    {asset.title}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="z-[9999] max-w-[min(560px,calc(100vw-2rem))] whitespace-normal break-words">{asset.title}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CreatorIdentityLink
            className="max-w-[45%] shrink-0 text-xs"
            nameClassName="truncate"
            displayName={asset.authorDisplayName}
            creatorName={asset.authorCreatorName ?? asset.creatorName}
            showAvatar={false}
            showNoCreatorPill={false}
            prefixBy
            stopPropagation
          />
        </div>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{asset.shortDescription || plainPreview(asset.descriptionMarkdown) || summarizeAsset(asset)}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          <AssetTag variant="category">{assetTypeLabel(category)}</AssetTag>
          {asset.tags.slice(0, 3).map((assetTag, index) =>
            onTagSelect ? (
              <AssetTagButton key={`${assetTag}-${index}`} onClick={(event) => handleTagClick(event, assetTag)}>
                {assetTag}
              </AssetTagButton>
            ) : (
              <AssetTag key={`${assetTag}-${index}`}>{assetTag}</AssetTag>
            ),
          )}
        </div>
        <div className="flex items-center justify-between gap-3 pt-3 text-xs font-semibold uppercase text-muted-foreground">
          <div className="flex min-w-0 items-center gap-3">
            <StatIcon icon={<Download className="h-3.5 w-3.5" />} label={formatStatLabel(asset.engagement?.downloadCount ?? 0, "download")} value={asset.engagement?.downloadCount ?? 0} />
            <button
              type="button"
              className={`workshop-control-free inline-flex items-center gap-1 transition-colors hover:text-primary disabled:cursor-wait disabled:opacity-70 ${liked ? "text-primary" : ""}`}
              aria-label={liked ? "Remove Thanks" : "Send Thanks"}
              aria-pressed={liked}
              disabled={thanksBusy}
              onClick={(event) => void handleThanksClick(event)}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              {formatCount(asset.engagement?.likeCount ?? 0)}
            </button>
            {asset.status !== "visible" ? <span className="text-destructive">{asset.status}</span> : null}
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1" title={formatDate(asset.createdAt)}>
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatRelativeDate(asset.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

function StatIcon({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={label}>
      {icon}
      {formatCount(value)}
    </span>
  );
}

function PreviewImage({ media, title }: { media?: WorkshopMedia; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const imageRef = useRef<ElementRef<"img"> | null>(null);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setSourceIndex(0);
  }, [media?.url]);

  const sources = media && !failed ? thumbnailDisplayUrls(media.url, { width: 360, height: 203, fit: "cover" }) : [];
  const source = sources[sourceIndex];

  useEffect(() => {
    if (!source) return;
    setLoaded(false);
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) setLoaded(true);
  }, [source]);

  if (!media || failed || !source) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return (
    <div className="relative aspect-video overflow-hidden bg-muted/50">
      {!loaded ? <ThumbnailLoading /> : null}
      <img
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`}
        src={source}
        alt={media.description || title}
        loading="lazy"
        ref={(image) => {
          imageRef.current = image;
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
    </div>
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

function selectPreview(media: WorkshopMedia[]) {
  return media.find((item) => item.kind === "thumbnail") ?? media.find((item) => item.kind === "gallery") ?? media[0];
}

function plainPreview(value?: string | null) {
  return (value ?? "")
    .replace(/[#*_`>~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 60) return "Last month";
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return formatDate(value);
}

function formatCount(value: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}

function formatStatLabel(value: number, label: string) {
  return `${value} ${value === 1 ? label : `${label}s`}`;
}
