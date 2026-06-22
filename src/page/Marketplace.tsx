import { useQuery } from "@tanstack/react-query";
import { Button, Input, toast } from "@aottg2/ui";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { listAssets, type SkinPartPayload, type SkinSetPayload, type WorkshopAsset, type WorkshopAssetType, type WorkshopMedia } from "../lib/api/workshop";

const pageSize = 24;
const typeFilters: Array<{ label: string; value: "" | WorkshopAssetType }> = [
  { label: "All", value: "" },
  { label: "Skin Parts", value: "skin_part" },
  { label: "Skin Sets", value: "skin_set" },
];

export function Marketplace() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const type = (searchParams.get("type") ?? "") as "" | WorkshopAssetType;
  const tag = searchParams.get("tag") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [searchText, setSearchText] = useState(q);

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  const query = useQuery({
    queryKey: ["workshop", "assets", { q, type, tag, page, pageSize }],
    queryFn: () => listAssets({ q, type, tag, page, pageSize }),
  });

  useEffect(() => {
    if (query.error) {
      toast.error("Could not load marketplace", { description: query.error instanceof Error ? query.error.message : "Try again." });
    }
  }, [query.error]);

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  function handleAddAsset() {
    navigate(isAuthenticated ? "/marketplace/create" : "/login");
  }

  function updateParams(next: { q?: string; type?: "" | WorkshopAssetType; tag?: string; page?: number }) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value === undefined || value === 1) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    if (next.q !== undefined || next.type !== undefined || next.tag !== undefined) {
      params.delete("page");
    }
    setSearchParams(params);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchText.trim(), page: 1 });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">Workshop Marketplace</h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">Browse shared AoTTG2 skins and skin sets from the community.</p>
        </div>
        <Button className="min-h-10 transition-transform active:scale-[0.96]" onClick={handleAddAsset}>
          ADD ASSET
        </Button>
      </div>

      <section className="mb-6 grid gap-3 border-y border-border py-4">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
          <Input className="h-10 text-sm" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search title, author, description, or tag" />
          <Button type="submit">Search</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((filter) => (
            <Button key={filter.label} type="button" variant={type === filter.value ? "default" : "ghost"} onClick={() => updateParams({ type: filter.value, page: 1 })}>
              {filter.label}
            </Button>
          ))}
          {tag ? (
            <Button type="button" variant="ghost" onClick={() => updateParams({ tag: "", page: 1 })}>
              TAG: {tag} x
            </Button>
          ) : null}
        </div>
      </section>

      {query.isLoading ? <AssetGridSkeleton /> : null}
      {query.isError ? <StateMessage title="Marketplace unavailable" message="Assets could not be loaded. Check the Workshop API and try again." /> : null}
      {query.data && query.data.assets.length === 0 ? <StateMessage title="No assets found" message="Try a different search, type, or tag filter." /> : null}
      {query.data && query.data.assets.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {query.data.assets.length} of {query.data.total} assets
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {query.data.assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} onTagSelect={(nextTag) => updateParams({ tag: nextTag, page: 1 })} />
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={page <= 1} onClick={() => updateParams({ page: page - 1 })}>
                Previous
              </Button>
              <Button type="button" variant="ghost" disabled={page >= totalPages} onClick={() => updateParams({ page: page + 1 })}>
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}

function AssetCard({ asset, onTagSelect }: { asset: WorkshopAsset; onTagSelect: (tag: string) => void }) {
  const thumbnail = selectPreview(asset.media);
  const summary = summarizeAsset(asset);
  return (
    <article className="grid overflow-hidden border border-border bg-card/60">
      <Link className="group grid" to={`/marketplace/assets/${asset.id}`}>
        <PreviewImage media={thumbnail} title={asset.title} />
        <div className="grid gap-3 p-4">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase text-muted-foreground">
            <span>{formatType(asset.type)}</span>
            <span>{formatDate(asset.createdAt)}</span>
          </div>
          <div>
            <h2 className="line-clamp-2 font-primary text-xl uppercase leading-none text-foreground group-hover:text-primary">{asset.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{plainPreview(asset.descriptionMarkdown) || summary}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground">{summary}</span>
            <span> by {asset.authorDisplayName}</span>
          </div>
        </div>
      </Link>
      {asset.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {asset.tags.slice(0, 4).map((assetTag) => (
            <button key={assetTag} type="button" className="min-h-8 border border-border px-2 text-xs font-semibold uppercase text-muted-foreground hover:text-primary" onClick={() => onTagSelect(assetTag)}>
              {assetTag}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function PreviewImage({ media, title }: { media?: WorkshopMedia; title: string }) {
  if (!media) {
    return <div className="grid aspect-[4/3] place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return <img className="aspect-[4/3] w-full object-cover" src={media.url} alt={media.description || title} loading="lazy" />;
}

function AssetGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="grid border border-border bg-card/60">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="grid gap-3 p-4">
            <div className="h-4 animate-pulse bg-muted" />
            <div className="h-8 animate-pulse bg-muted" />
            <div className="h-4 animate-pulse bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StateMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="grid min-h-60 place-items-center border border-border bg-card/40 p-6 text-center">
      <div>
        <h2 className="font-primary text-2xl uppercase text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function selectPreview(media: WorkshopMedia[]) {
  return media.find((item) => item.kind === "thumbnail") ?? media.find((item) => item.kind === "gallery") ?? media[0];
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

  return formatType(asset.type);
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

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}
