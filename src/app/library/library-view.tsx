"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, Input } from "@aottg2/ui";
import { Box, CalendarDays, Download, Eye, FileCode2, Glasses, Grid3X3, Hammer, HardHat, Heart, Image, Map, Mountain, Palette, ScanFace, Shirt, Sparkles, Swords, UploadCloud, User, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../../auth/useAuth";
import { AssetTag, AssetTagButton } from "../../components/AssetTag";
import { SideCard } from "../../components/SideCard";
import { assetPath, listAssets, type AssetListQuery, type AssetListResponse, type SkinPartPayload, type SkinSetPayload, type WorkshopAsset, type WorkshopMedia } from "../../lib/api/workshop";
import { toast } from "../../lib/toast";

const pageSize = 24;
const typeFilters = [
  { label: "All", value: "" },
  { label: "Skin Parts", value: "skin_part" },
  { label: "Skin Sets", value: "skin_set" },
];
const categoryFilters = [
  { label: "Human", category: "human", icon: User },
  { label: "Titan", category: "titan", icon: Mountain },
  { label: "Shifter", category: "shifter", icon: Zap },
  { label: "Skybox", category: "skybox", icon: Image },
  { label: "Custom Logic", type: "custom_logic", icon: FileCode2 },
  { label: "Maps", type: "map", icon: Map },
];
const humanParts = ["Hair", "Eye", "Glass", "Face", "Skin", "Costume", "Logo", "Gear", "Gas", "Hoodie", "WeaponTrail", "Horse", "Thunderspears", "Hooks", "Hat", "Head", "Back"];
const humanPartIcons = {
  Hair: Sparkles,
  Eye,
  Glass: Glasses,
  Face: ScanFace,
  Skin: User,
  Costume: Shirt,
  Logo: Palette,
  Gear: Box,
  Gas: Zap,
  Hoodie: Shirt,
  WeaponTrail: Swords,
  Horse: User,
  Thunderspears: Zap,
  Hooks: Hammer,
  Hat: HardHat,
  Head: ScanFace,
  Back: Grid3X3,
} satisfies Record<string, typeof User>;

interface LibraryViewProps {
  initialData: AssetListResponse;
  initialQuery: AssetListQuery & { page: number; pageSize: number };
  initialError: boolean;
}

export function LibraryView({ initialData, initialError, initialQuery }: LibraryViewProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
    initialData: sameQuery(initialQuery, { q, type, tag, category, slot, page, pageSize }) && !initialError ? initialData : undefined,
  });

  useEffect(() => {
    if (query.error) {
      toast.error("Could not load library", { description: query.error instanceof Error ? query.error.message : "Try again." });
    }
  }, [query.error]);

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  function handleAddAsset() {
    router.push(isAuthenticated ? "/library/publish" : "/login");
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
    router.push(`/library${params.size ? `?${params}` : ""}`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchText.trim(), page: 1 });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">Library</h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">Browse shared AoTTG2 skins, sets, maps, and custom logic.</p>
        </div>
        <Button className="min-h-10 transition-transform active:scale-[0.96]" onClick={handleAddAsset}>
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          PUBLISH ASSET
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="grid content-start gap-4">
          <SideCard title="Category" contentClassName="grid gap-1 p-2">
            <SideFilterItem active={!category && !type && !slot} icon={<Grid3X3 className="h-4 w-4" />} label="All content" onClick={() => updateParams({ category: "", type: "", slot: "", page: 1 })} />
            {categoryFilters.map((item) => (
              <SideFilterItem
                key={item.label}
                active={Boolean((item.category && category === item.category && !slot) || (item.type && type === item.type))}
                icon={<item.icon className="h-4 w-4" />}
                label={item.label}
                onClick={() => updateParams({ category: item.category ?? "", type: item.type ?? "", slot: "", page: 1 })}
              />
            ))}
          </SideCard>

          <SideCard title="Human Parts" variant="secondary" contentClassName="grid gap-1 p-2">
            {humanParts.map((part) => (
              <SideFilterItem key={part} active={category === "human" && slot === part} icon={renderHumanPartIcon(part)} label={part} onClick={() => updateParams({ category: "human", type: "", slot: part, page: 1 })} />
            ))}
          </SideCard>
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
          {query.isError ? <StateMessage title="Library unavailable" message="Assets could not be loaded. Check the Workshop API and try again." /> : null}
          {query.data && query.data.assets.length === 0 ? <StateMessage title="No assets found" message="Try a different search, category, part, or tag filter." /> : null}
          {query.data && query.data.assets.length > 0 ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span>Showing {query.data.assets.length} of {query.data.total} assets</span>
                <span>Newest first</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {query.data.assets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} onTagSelect={(nextTag) => updateParams({ tag: nextTag, page: 1 })} />
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
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

function SideFilterItem({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      className="flex h-10 min-w-10 w-full items-center gap-3 px-2 font-primary text-sm tracking-wide text-foreground transition-[color,background-color,transform] duration-150 ease-out hover:bg-muted/60 hover:text-primary active:scale-[0.96] aria-[current=page]:bg-muted/70 aria-[current=page]:text-primary"
      onClick={onClick}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function renderHumanPartIcon(part: string) {
  const Icon = humanPartIcons[part as keyof typeof humanPartIcons] ?? Box;
  return <Icon className="h-4 w-4" />;
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
      <Link className="group grid" href={assetPath(asset)}>
        <PreviewImage media={thumbnail} title={asset.title} />
      </Link>
      <div className="flex min-h-56 flex-col gap-2 p-3">
        <Link className="line-clamp-1 text-sm text-foreground hover:text-primary" href={assetPath(asset)}>
          <span className="font-primary font-semibold uppercase">{asset.title}</span> <span className="font-normal text-muted-foreground">by {asset.authorDisplayName}</span>
        </Link>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{asset.shortDescription || plainPreview(asset.descriptionMarkdown) || summarizeAsset(asset)}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          <AssetTag variant="category">{formatLabel(category)}</AssetTag>
          {asset.tags.slice(0, 3).map((assetTag, index) => (
            <AssetTagButton key={`${assetTag}-${index}`} onClick={() => onTagSelect(assetTag)}>
              {assetTag}
            </AssetTagButton>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 pt-3 text-xs font-semibold uppercase text-muted-foreground">
          <div className="flex min-w-0 items-center gap-3">
            <StatIcon icon={<Download className="h-3.5 w-3.5" />} label={`${asset.engagement?.downloadCount ?? 0} downloads`} value={asset.engagement?.downloadCount ?? 0} />
            <StatIcon icon={<Heart className="h-3.5 w-3.5" />} label={`${asset.engagement?.likeCount ?? 0} likes`} value={asset.engagement?.likeCount ?? 0} />
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

function sameQuery(left: AssetListQuery, right: AssetListQuery) {
  return (left.q ?? "") === (right.q ?? "") && (left.type ?? "") === (right.type ?? "") && (left.tag ?? "") === (right.tag ?? "") && (left.category ?? "") === (right.category ?? "") && (left.slot ?? "") === (right.slot ?? "") && (left.page ?? 1) === (right.page ?? 1);
}
