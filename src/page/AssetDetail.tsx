import { useQuery } from "@tanstack/react-query";
import { Button, toast } from "@aottg2/ui";
import { useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, useParams } from "react-router-dom";
import { getAsset, type SkinPartPayload, type SkinSetItem, type SkinSetPayload, type WorkshopAsset, type WorkshopMedia } from "../lib/api/workshop";

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
    queryFn: () => getAsset(id),
    enabled: Boolean(id),
  });

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

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-8">
        <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" to="/marketplace">
          Back to marketplace
        </Link>
        <div className="mt-6 border border-border bg-card/40 p-6">
          <h1 className="font-primary text-3xl uppercase">Asset not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This asset could not be loaded.</p>
        </div>
      </main>
    );
  }

  return <AssetDetailContent asset={query.data} />;
}

function AssetDetailContent({ asset }: { asset: WorkshopAsset }) {
  const media = mediaForGallery(asset.media);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = media[activeIndex];
  const textureUrls = collectTextureUrls(asset);
  const category = assetCategory(asset);
  const summary = summarizeAsset(asset);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  }

  function comingSoon(label: string) {
    toast.info(`${label} coming soon`);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" to="/marketplace">
        Back to marketplace
      </Link>

      <header className="mt-5 border-b border-border pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 gap-4">
            <PreviewIcon media={activeMedia} title={asset.title} />
            <div className="min-w-0">
              <h1 className="font-primary text-balance text-4xl font-semibold uppercase leading-none tracking-tight">{asset.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatLabel(category)} / {formatLabel(asset.type)} / {summary}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">By {asset.authorDisplayName}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => copyText("JSON payload", JSON.stringify(asset.payload, null, 2))}>
              Copy JSON
            </Button>
            <Button type="button" variant="ghost" onClick={() => comingSoon("Like")}>
              Like
            </Button>
            <Button type="button" variant="ghost" onClick={() => comingSoon("Favorite")}>
              Favorite
            </Button>
            <Button type="button" variant="ghost" onClick={() => copyText("asset id", asset.id)}>
              Copy ID
            </Button>
            <Button type="button" variant="ghost" onClick={() => copyText("asset link", window.location.href)}>
              Copy Link
            </Button>
            <Button type="button" variant="ghost" onClick={() => comingSoon("Report")}>
              Report
            </Button>
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
                  <button key={`${item.url}-${index}`} type="button" className={`border ${index === activeIndex ? "border-primary" : "border-border"}`} onClick={() => setActiveIndex(index)}>
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
              <Pill label={formatLabel(category)} strong />
              {asset.tags.length > 0 ? (
                asset.tags.map((tag) => (
                  <Link key={tag} className="min-h-8 bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground hover:text-primary" to={`/marketplace?tag=${encodeURIComponent(tag)}`}>
                    {tag}
                  </Link>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags</span>
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

function PreviewIcon({ media, title }: { media?: WorkshopMedia; title: string }) {
  if (!media) {
    return <div className="grid h-20 w-20 shrink-0 place-items-center bg-muted font-primary text-xs uppercase text-muted-foreground">No image</div>;
  }

  return <img className="h-20 w-20 shrink-0 border border-border object-cover" src={media.url} alt={media.description || title} />;
}

function GalleryImage({ media, title }: { media?: WorkshopMedia; title: string }) {
  if (!media) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return <img className="aspect-video w-full object-cover" src={media.url} alt={media.description || title} />;
}

function Pill({ label, strong = false }: { label: string; strong?: boolean }) {
  return <span className={`min-h-8 px-2 py-1 text-xs font-semibold ${strong ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{label}</span>;
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
