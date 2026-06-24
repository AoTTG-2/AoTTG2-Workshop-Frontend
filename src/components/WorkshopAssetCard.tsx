"use client";

import { Spinner, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@aottg2/ui";
import { CalendarDays, Download, ThumbsUp } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useState } from "react";
import { AssetTag, AssetTagButton } from "./AssetTag";
import { CreatorIdentityLink } from "./CreatorIdentityLink";
import type { SkinPartPayload, SkinSetPayload, WorkshopAsset, WorkshopMedia } from "../lib/api/workshop";

interface WorkshopAssetCardProps {
  asset: WorkshopAsset;
  interactive?: boolean;
  onOpen?: () => void;
  onTagSelect?: (tag: string) => void;
}

export function WorkshopAssetCard({ asset, interactive = true, onOpen, onTagSelect }: WorkshopAssetCardProps) {
  const thumbnail = selectPreview(asset.media);
  const category = assetCategory(asset);
  const canOpen = interactive && Boolean(onOpen);

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
          <AssetTag variant="category">{formatLabel(category)}</AssetTag>
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
            <StatIcon icon={<ThumbsUp className="h-3.5 w-3.5" />} label={`${asset.engagement?.likeCount ?? 0} Thanks`} value={asset.engagement?.likeCount ?? 0} />
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

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [media?.url]);

  if (!media || failed) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return (
    <div className="relative aspect-video overflow-hidden bg-muted/50">
      {!loaded ? <ThumbnailLoading /> : null}
      <img className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${loaded ? "opacity-100" : "opacity-0"}`} src={media.url} alt={media.description || title} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
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

function isSkinPartPayload(payload: WorkshopAsset["payload"]): payload is SkinPartPayload {
  return "slot" in payload || "textureUrl" in payload;
}

function isSkinSetPayload(payload: WorkshopAsset["payload"]): payload is SkinSetPayload {
  return "items" in payload;
}

function plainPreview(value?: string | null) {
  return (value ?? "")
    .replace(/[#*_`>~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
