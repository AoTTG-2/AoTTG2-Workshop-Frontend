import { useQuery } from "@tanstack/react-query";
import { Button, toast } from "@aottg2/ui";
import { Link, useParams } from "react-router-dom";
import { getAsset, type SkinPartPayload, type SkinSetItem, type SkinSetPayload, type WorkshopAsset, type WorkshopMedia } from "../lib/api/workshop";

export function AssetDetail() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["workshop", "asset", id],
    queryFn: () => getAsset(id),
    enabled: Boolean(id),
  });

  if (query.isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="grid content-start gap-4">
            <div className="h-10 animate-pulse bg-muted" />
            <div className="h-24 animate-pulse bg-muted" />
            <div className="h-10 animate-pulse bg-muted" />
          </div>
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
  const preview = selectPreview(asset.media);
  const gallery = asset.media.filter((item) => item.url !== preview?.url);
  const textureUrls = collectTextureUrls(asset);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <Link className="text-sm font-semibold text-muted-foreground hover:text-primary" to="/marketplace">
        Back to marketplace
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="grid content-start gap-4">
          <PreviewImage media={preview} title={asset.title} />
          {gallery.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {gallery.slice(0, 6).map((item) => (
                <img key={item.url} className="aspect-[4/3] w-full border border-border object-cover" src={item.url} alt={item.description || asset.title} loading="lazy" />
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid content-start gap-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <span>{formatType(asset.type)}</span>
              <span>{formatDate(asset.createdAt)}</span>
            </div>
            <h1 className="font-primary text-balance text-4xl font-semibold uppercase leading-none tracking-tight">{asset.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">By {asset.authorDisplayName}</p>
          </div>

          {asset.descriptionMarkdown ? (
            <section className="border-t border-border pt-5">
              <h2 className="font-primary text-xl uppercase">Description</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{plainText(asset.descriptionMarkdown)}</p>
            </section>
          ) : null}

          <section className="border-t border-border pt-5">
            <h2 className="font-primary text-xl uppercase">Asset Summary</h2>
            <AssetSummary asset={asset} />
          </section>

          {asset.tags.length > 0 ? (
            <section className="border-t border-border pt-5">
              <h2 className="font-primary text-xl uppercase">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {asset.tags.map((tag) => (
                  <Link key={tag} className="min-h-8 border border-border px-2 py-1 text-xs font-semibold uppercase text-muted-foreground hover:text-primary" to={`/marketplace?tag=${encodeURIComponent(tag)}`}>
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-3 border-t border-border pt-5">
            <Button type="button" onClick={() => copyText("JSON payload", JSON.stringify(asset.payload, null, 2))}>
              Copy JSON Payload
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="ghost" onClick={() => copyText("asset id", asset.id)}>
                Copy Asset ID
              </Button>
              {textureUrls.length > 0 ? (
                <Button type="button" variant="ghost" onClick={() => copyText("texture URLs", textureUrls.join("\n"))}>
                  Copy Texture URLs
                </Button>
              ) : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function AssetSummary({ asset }: { asset: WorkshopAsset }) {
  if (asset.type === "skin_part" && isSkinPartPayload(asset.payload)) {
    return (
      <dl className="mt-3 grid gap-2 text-sm text-muted-foreground">
        <SummaryRow label="Category" value={asset.payload.category} />
        <SummaryRow label="Slot" value={asset.payload.slot} />
        <SummaryRow label="Variant scope" value={asset.payload.variantScope} />
        <SummaryRow label="Variants" value={asset.payload.variants?.join(", ")} />
        <SummaryRow label="Texture URL" value={asset.payload.textureUrl} />
      </dl>
    );
  }

  if (asset.type === "skin_set" && isSkinSetPayload(asset.payload)) {
    return (
      <div className="mt-3 grid gap-3 text-sm">
        <SummaryRow label="Category" value={asset.payload.category} />
        {(asset.payload.items ?? []).map((item, index) => (
          <div key={`${item.slot}-${index}`} className="border-l border-border pl-3 text-muted-foreground">
            <div className="font-semibold text-foreground">Item {index + 1}: {item.slot ?? "Unknown slot"}</div>
            <div>{summarizeSetItem(item)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="mt-3 overflow-auto bg-muted p-3 text-xs text-muted-foreground">{JSON.stringify(asset.payload, null, 2)}</pre>;
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

function PreviewImage({ media, title }: { media?: WorkshopMedia; title: string }) {
  if (!media) {
    return <div className="grid aspect-[4/3] place-items-center border border-border bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return <img className="aspect-[4/3] w-full border border-border object-cover" src={media.url} alt={media.description || title} />;
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

function selectPreview(media: WorkshopMedia[]) {
  return media.find((item) => item.kind === "thumbnail") ?? media.find((item) => item.kind === "gallery") ?? media[0];
}

function isSkinPartPayload(payload: WorkshopAsset["payload"]): payload is SkinPartPayload {
  return "slot" in payload || "textureUrl" in payload;
}

function isSkinSetPayload(payload: WorkshopAsset["payload"]): payload is SkinSetPayload {
  return "items" in payload;
}

function plainText(value: string) {
  return value.replace(/[#*_`>~-]/g, "").trim();
}

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
