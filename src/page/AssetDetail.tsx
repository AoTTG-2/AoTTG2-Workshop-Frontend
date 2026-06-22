import { useQuery } from "@tanstack/react-query";
import { Button } from "@aottg2/ui";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Download, Eye, Flag, Heart, Link as LinkIcon, MoreHorizontal, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getAccessToken } from "../auth/storage";
import { useAuth } from "../auth/useAuth";
import { AssetTag, AssetTagLink } from "../components/AssetTag";
import { getAsset, setAssetFavorite, setAssetLike, trackAssetDownload, trackAssetView, type SkinPartPayload, type SkinSetItem, type SkinSetPayload, type WorkshopAsset, type WorkshopMedia } from "../lib/api/workshop";
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

export function AssetDetail() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["workshop", "asset", id],
    queryFn: () => getAsset(id, getAccessToken()),
    enabled: Boolean(id),
  });
  const asset = query.data;
  const refetchAsset = query.refetch;
  const trackedView = useRef<string | null>(null);

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
        <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" to="/library">
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
  const { isAuthenticated } = useAuth();
  const media = mediaForGallery(asset.media);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = media[activeIndex];
  const textureUrls = collectTextureUrls(asset);
  const category = assetCategory(asset);
  const summary = summarizeAsset(asset);
  const liked = Boolean(asset.viewerEngagement?.liked);
  const favorited = Boolean(asset.viewerEngagement?.favorited);

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
      toast.info("Sign in to like assets.", { description: "Likes are saved to your account." });
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" to="/library">
        Back to library
      </Link>

      <header className="mt-5 border-b border-border pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="font-primary text-balance text-4xl font-semibold uppercase leading-none tracking-tight">{asset.title}</h1>
            {asset.shortDescription ? <p className="mt-3 line-clamp-1 max-w-2xl text-base text-foreground">{asset.shortDescription}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase text-muted-foreground">
              <EngagementStat icon={<Download className="h-4 w-4" />} label="downloads" value={asset.engagement?.downloadCount ?? 0} />
              <EngagementStat icon={<Heart className="h-4 w-4" />} label="likes" value={asset.engagement?.likeCount ?? 0} />
              <EngagementStat icon={<Eye className="h-4 w-4" />} label="views" value={asset.engagement?.viewCount ?? 0} />
            </div>
          </div>
          <div className="flex flex-wrap items-start gap-2 md:justify-end">
            <Button type="button" onClick={importAsset}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Import Asset
            </Button>
            <Button type="button" variant="ghost" aria-label={liked ? "Unlike" : "Like"} title={liked ? "Unlike" : "Like"} onClick={() => void toggleLike()}>
              <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} aria-hidden="true" />
            </Button>
            <Button type="button" variant="ghost" aria-label={favorited ? "Unfavorite" : "Favorite"} title={favorited ? "Unfavorite" : "Favorite"} onClick={() => void toggleFavorite()}>
              <Star className="h-4 w-4" fill={favorited ? "currentColor" : "none"} aria-hidden="true" />
            </Button>
            <details className="group relative">
              <summary className="workshop-control-free flex h-10 min-h-10 cursor-pointer list-none items-center border border-border px-3 text-sm font-semibold uppercase text-muted-foreground hover:text-primary [&::-webkit-details-marker]:hidden" aria-label="More actions" title="More actions">
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 top-11 z-20 grid w-44 border border-border bg-popover p-1 text-popover-foreground shadow-md">
                <MenuAction icon={<Copy className="h-4 w-4" />} label="Copy ID" onClick={() => copyText("asset id", asset.id)} />
                <MenuAction icon={<LinkIcon className="h-4 w-4" />} label="Copy Link" onClick={() => copyText("asset link", window.location.href)} />
                <MenuAction icon={<Flag className="h-4 w-4" />} label="Report" onClick={() => comingSoon("Report")} />
              </div>
            </details>
          </div>
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-5">
          <section className="border border-border bg-card/50 p-3">
            <GalleryImage media={activeMedia} title={asset.title} />
            {media.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {media.map((item, index) => (
                  <button key={`${item.url}-${index}`} type="button" className={`workshop-control-free border ${index === activeIndex ? "border-primary" : "border-border"}`} onClick={() => setActiveIndex(index)}>
                    <img className="aspect-video w-full object-cover" src={item.url} alt={item.description || asset.title} loading="lazy" />
                  </button>
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
        </section>

        <aside className="grid content-start gap-4">
          <InfoPanel title="Tags">
            <div className="flex flex-wrap gap-2">
              <AssetTag variant="category" size="md">
                {formatLabel(category)}
              </AssetTag>
              {asset.tags.length > 0 ? (
                asset.tags.map((tag) => (
                  <AssetTagLink key={tag} size="md" to={`/library?tag=${encodeURIComponent(tag)}`}>
                    {tag}
                  </AssetTagLink>
                ))
              ) : (
                <AssetTag variant="empty" size="md">
                  No tags
                </AssetTag>
              )}
            </div>
          </InfoPanel>

          <InfoPanel title="Creator">
            <div className="text-sm font-semibold text-foreground">{asset.authorDisplayName}</div>
            <div className="mt-1 text-xs text-muted-foreground">Owner</div>
          </InfoPanel>

          <InfoPanel title="Details">
            <dl className="grid gap-2 text-sm">
              <SummaryRow label="Type" value={formatLabel(asset.type)} />
              <SummaryRow label="Category" value={formatLabel(category)} />
              <SummaryRow label="Summary" value={summary} />
              <SummaryRow label="Published" value={formatDate(asset.createdAt)} />
              <SummaryRow label="Updated" value={formatDate(asset.updatedAt)} />
            </dl>
          </InfoPanel>

          <InfoPanel title="Payload">
            <AssetSummary asset={asset} />
            {textureUrls.length > 0 ? (
              <Button className="mt-3 w-full" type="button" variant="ghost" onClick={() => copyText("texture URLs", textureUrls.join("\n"))}>
                Copy Texture URLs
              </Button>
            ) : null}
          </InfoPanel>
        </aside>
      </div>
    </main>
  );
}

function EngagementStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {formatCount(value)} {label}
    </span>
  );
}

function MenuAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void | Promise<void> }) {
  return (
    <button type="button" role="menuitem" className="workshop-control-free flex items-center gap-2 px-2 py-1.5 text-left text-sm font-semibold uppercase text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => void onClick()}>
      {icon}
      {label}
    </button>
  );
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-border bg-card/50 p-4">
      <h2 className="font-primary text-xl uppercase leading-none text-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
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
  if (!media) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return <img className="aspect-video w-full object-cover" src={media.url} alt={media.description || title} />;
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
