import { useQuery } from "@tanstack/react-query";
import { Button, Input } from "@aottg2/ui";
import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { AssetTag, AssetTagButton } from "../components/AssetTag";
import { listAssets, type SkinPartPayload, type SkinSetPayload, type WorkshopAsset, type WorkshopMedia } from "../lib/api/workshop";
import { toast } from "../lib/toast";

const pageSize = 24;
const typeFilters = [
  { label: "All", value: "" },
  { label: "Skin Parts", value: "skin_part" },
  { label: "Skin Sets", value: "skin_set" },
];
const categoryFilters = [
  { label: "Human", category: "human" },
  { label: "Titan", category: "titan" },
  { label: "Shifter", category: "shifter" },
  { label: "Skybox", category: "skybox" },
  { label: "Custom Logic", type: "custom_logic" },
  { label: "Maps", type: "map" },
];
const humanParts = [
  "Hair",
  "Eye",
  "Glass",
  "Face",
  "Skin",
  "Costume",
  "Logo",
  "Gear",
  "Gas",
  "Hoodie",
  "WeaponTrail",
  "Horse",
  "Thunderspears",
  "Hooks",
  "Hat",
  "Head",
  "Back",
];

export function Marketplace() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const category = searchParams.get("category") ?? "";
  const slot = searchParams.get("slot") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [searchText, setSearchText] = useState(q);

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  const query = useQuery({
    queryKey: ["workshop", "assets", { q, type, tag, category, slot, page, pageSize }],
    queryFn: () => listAssets({ q, type, tag, category, slot: normalizeSlotParam(slot), page, pageSize }),
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

  function updateParams(next: { q?: string; type?: string; tag?: string; category?: string; slot?: string; page?: number }) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value === undefined || value === 1) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    if (next.q !== undefined || next.type !== undefined || next.tag !== undefined || next.category !== undefined || next.slot !== undefined) {
      params.delete("page");
    }
    setSearchParams(params);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchText.trim(), page: 1 });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">Workshop Marketplace</h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">Browse shared AoTTG2 skins, sets, maps, and custom logic.</p>
        </div>
        <Button className="min-h-10 transition-transform active:scale-[0.96]" onClick={handleAddAsset}>
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          PUBLISH ASSET
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="grid content-start gap-4">
          <FilterSection title="Category">
            <FilterButton active={!category && !type && !slot} label="All content" onClick={() => updateParams({ category: "", type: "", slot: "", page: 1 })} />
            {categoryFilters.map((item) => (
              <FilterButton
                key={item.label}
                active={Boolean((item.category && category === item.category && !slot) || (item.type && type === item.type))}
                label={item.label}
                onClick={() => updateParams({ category: item.category ?? "", type: item.type ?? "", slot: "", page: 1 })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Human Parts">
            {humanParts.map((part) => (
              <FilterButton key={part} active={category === "human" && slot === part} label={part} onClick={() => updateParams({ category: "human", type: "", slot: part, page: 1 })} />
            ))}
          </FilterSection>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 grid gap-3 rounded-none border border-border bg-card/50 p-3">
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
              <Input className="h-10 text-sm" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search workshop assets..." />
              <Button type="submit">Search</Button>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {typeFilters.map((filter) => (
                  <Button key={filter.label} type="button" variant={type === filter.value ? "default" : "ghost"} onClick={() => updateParams({ type: filter.value, page: 1 })}>
                    {filter.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {tag ? <ActivePill label={`Tag: ${tag}`} onClear={() => updateParams({ tag: "", page: 1 })} /> : null}
                {category ? <ActivePill label={`Category: ${formatLabel(category)}`} onClear={() => updateParams({ category: "", slot: "", page: 1 })} /> : null}
                {slot ? <ActivePill label={`Part: ${slot}`} onClear={() => updateParams({ slot: "", page: 1 })} /> : null}
              </div>
            </div>
          </div>

          {query.isLoading ? <AssetGridSkeleton /> : null}
          {query.isError ? <StateMessage title="Marketplace unavailable" message="Assets could not be loaded. Check the Workshop API and try again." /> : null}
          {query.data && query.data.assets.length === 0 ? <StateMessage title="No assets found" message="Try a different search, category, part, or tag filter." /> : null}
          {query.data && query.data.assets.length > 0 ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>
                  Showing {query.data.assets.length} of {query.data.total} assets
                </span>
                <span>Newest first</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        </section>
      </div>
    </main>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-2 border border-border bg-card/50 p-3">
      <h2 className="font-primary text-sm uppercase text-foreground">{title}</h2>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" className={`min-h-9 px-2 text-left text-sm font-semibold transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`} onClick={onClick}>
      {label}
    </button>
  );
}

function ActivePill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button type="button" className="min-h-8 border border-border px-2 text-xs font-semibold uppercase text-muted-foreground hover:text-primary" onClick={onClear}>
      {label} x
    </button>
  );
}

function AssetCard({ asset, onTagSelect }: { asset: WorkshopAsset; onTagSelect: (tag: string) => void }) {
  const thumbnail = selectPreview(asset.media);
  const category = assetCategory(asset);
  return (
    <article className="grid overflow-hidden border border-border bg-card/60 transition-colors hover:border-primary/60">
      <Link className="group grid" to={`/marketplace/assets/${asset.id}`}>
        <PreviewImage media={thumbnail} title={asset.title} />
      </Link>
      <div className="flex min-h-56 flex-col gap-2 p-3">
        <Link className="line-clamp-1 text-sm text-foreground hover:text-primary" to={`/marketplace/assets/${asset.id}`}>
          <span className="font-primary font-semibold uppercase">{asset.title}</span> <span className="font-normal text-muted-foreground">by {asset.authorDisplayName}</span>
        </Link>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{plainPreview(asset.descriptionMarkdown) || summarizeAsset(asset)}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          <AssetTag variant="category">{formatLabel(category)}</AssetTag>
          {asset.tags.slice(0, 3).map((assetTag) => (
            <AssetTagButton key={assetTag} onClick={() => onTagSelect(assetTag)}>
              {assetTag}
            </AssetTagButton>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 pt-3 text-xs font-semibold uppercase text-muted-foreground">
          <span>{summarizeAsset(asset)}</span>
          <span>{formatDate(asset.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}

function PreviewImage({ media, title }: { media?: WorkshopMedia; title: string }) {
  if (!media) {
    return <div className="grid aspect-video place-items-center bg-muted/50 font-primary text-sm uppercase text-muted-foreground">No preview</div>;
  }

  return <img className="aspect-video w-full object-cover" src={media.url} alt={media.description || title} loading="lazy" />;
}

function AssetGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }, (_, index) => (
        <div key={index} className="grid border border-border bg-card/60">
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="grid gap-3 p-3">
            <div className="h-4 animate-pulse bg-muted" />
            <div className="h-10 animate-pulse bg-muted" />
            <div className="h-7 animate-pulse bg-muted" />
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

function isSkinPartPayload(payload: WorkshopAsset["payload"]): payload is SkinPartPayload {
  return "slot" in payload || "textureUrl" in payload;
}

function isSkinSetPayload(payload: WorkshopAsset["payload"]): payload is SkinSetPayload {
  return "items" in payload;
}

function normalizeSlotParam(value: string) {
  if (value === "Gear") return "GearL";
  if (value === "Thunderspears") return "ThunderspearL";
  if (value === "Hooks") return "HookL";
  return value;
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
