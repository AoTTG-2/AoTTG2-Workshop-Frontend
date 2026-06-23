"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input } from "@aottg2/ui";
import { Box, CalendarDays, ChevronDown, Download, Eye, FileCode2, Glasses, Grid3X3, Hammer, HardHat, Image, Map, Mountain, Palette, ScanFace, Search, Shirt, Sparkles, Swords, ThumbsUp, UploadCloud, User, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { SideCard } from "../../components/SideCard";
import { WorkshopAssetCard } from "../../components/WorkshopAssetCard";
import { assetPath, listAssets, type AssetListQuery, type AssetListResponse } from "../../lib/api/workshop";
import { toast } from "../../lib/toast";

const pageSize = 24;
const typeFilters = [
  { label: "All", value: "" },
  { label: "Skin Parts", value: "skin_part" },
  { label: "Skin Sets", value: "skin_set" },
];
const sortOptions = [
  { label: "Relevance", value: "relevance", icon: Search },
  { label: "Newest", value: "newest", icon: CalendarDays },
  { label: "Popular", value: "popular", icon: Sparkles },
  { label: "Trending", value: "trending", icon: Zap },
  { label: "Most Downloaded", value: "most_downloaded", icon: Download },
  { label: "Most Thanked", value: "most_liked", icon: ThumbsUp },
  { label: "Most Viewed", value: "most_viewed", icon: Eye },
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
  const reduceMotion = useReducedMotion();
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const category = searchParams.get("category") ?? "";
  const slot = searchParams.get("slot") ?? "";
  const sort = searchParams.get("sort") ?? "relevance";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [searchText, setSearchText] = useState(q);

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  const query = useQuery({
    queryKey: ["workshop", "assets", { q, type, tag, category, slot, sort, page, pageSize }],
    queryFn: () => listAssets({ q, type, tag, category, slot: normalizeSlotParam(slot), sort, page, pageSize }),
    initialData: sameQuery(initialQuery, { q, type, tag, category, slot, sort, page, pageSize }) && !initialError ? initialData : undefined,
  });

  useEffect(() => {
    if (query.error) {
      toast.error("Could not load library", { description: query.error instanceof Error ? query.error.message : "Try again." });
    }
  }, [query.error]);

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  function handleAddAsset() {
    router.push(isAuthenticated ? "/library/publish" : "/login?next=%2Flibrary%2Fpublish");
  }

  function updateParams(next: { q?: string; type?: string; tag?: string; category?: string; slot?: string; sort?: string; page?: number }) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value === undefined || value === 1 || (key === "sort" && value === "relevance")) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    if (next.q !== undefined || next.type !== undefined || next.tag !== undefined || next.category !== undefined || next.slot !== undefined || next.sort !== undefined) {
      params.delete("page");
    }
    router.push(`/library${params.size ? `?${params}` : ""}`);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchText.trim(), sort, page: 1 });
  }

  function handleSortSelect(nextSort: string) {
    updateParams({ q: searchText.trim(), sort: nextSort, page: 1 });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <motion.div className="mb-6 flex flex-wrap items-start justify-between gap-4" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0)}>
        <div>
          <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">Library</h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">Browse shared AoTTG2 skins, sets, maps, and custom logic.</p>
        </div>
        <Button className="min-h-10 transition-transform active:scale-[0.96]" onClick={handleAddAsset}>
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          PUBLISH ASSET
        </Button>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <motion.aside className="grid content-start gap-4" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.03)}>
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
        </motion.aside>

        <section className="min-w-0">
          <motion.div className="mb-4 grid gap-3 rounded-none border border-border bg-card/50 p-3" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.06)}>
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
              <Input className="h-10 text-sm" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search workshop assets..." />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="secondary" className="min-h-10 justify-between gap-2">
                    {renderSortIcon(sort)}
                    {sortLabel(sort)}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      className={`gap-2 ${sort === option.value ? "bg-secondary text-secondary-foreground" : ""}`}
                      aria-current={sort === option.value ? "true" : undefined}
                      onSelect={() => handleSortSelect(option.value)}
                    >
                      <option.icon className="h-4 w-4" aria-hidden="true" />
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
          </motion.div>

          {query.isLoading ? <AssetGridSkeleton /> : null}
          {query.isError ? <StateMessage title="Library unavailable" message="Assets could not be loaded. Check the Workshop API and try again." /> : null}
          {query.data && query.data.assets.length === 0 ? <StateMessage title="No assets found" message="Try a different search, category, part, or tag filter." /> : null}
          {query.data && query.data.assets.length > 0 ? (
            <>
              <motion.div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground" initial={motionInitial(reduceMotion, 6)} animate={motionAnimate} transition={motionTransition(0.09)}>
                <span>Showing {query.data.assets.length} of {query.data.total} assets</span>
                <span>{sortLabel(sort)} first</span>
              </motion.div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {query.data.assets.map((asset, index) => (
                  <motion.div key={asset.id} className="relative z-0 hover:z-50 focus-within:z-50" initial={motionInitial(reduceMotion, 10)} animate={motionAnimate} transition={motionTransition(Math.min(index, 12) * 0.025)}>
                    <WorkshopAssetCard asset={asset} onOpen={() => router.push(assetPath(asset))} onTagSelect={(nextTag) => updateParams({ tag: nextTag, page: 1 })} />
                  </motion.div>
                ))}
              </div>
              <motion.div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4" initial={motionInitial(reduceMotion, 6)} animate={motionAnimate} transition={motionTransition(0.12)}>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" disabled={page <= 1} onClick={() => updateParams({ page: page - 1 })}>
                    Previous
                  </Button>
                  <Button type="button" variant="ghost" disabled={page >= totalPages} onClick={() => updateParams({ page: page + 1 })}>
                    Next
                  </Button>
                </div>
              </motion.div>
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

function normalizeSlotParam(value: string) {
  if (value === "Gear") return "GearL";
  if (value === "Thunderspears") return "ThunderspearL";
  if (value === "Hooks") return "HookL";
  return value;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const motionAnimate = { opacity: 1, y: 0 };

function motionInitial(reduceMotion: boolean | null, y: number) {
  return reduceMotion ? false : { opacity: 0, y };
}

function motionTransition(delay: number) {
  return { duration: 0.18, ease: "easeOut" as const, delay };
}

function renderSortIcon(sort: string) {
  const Icon = sortOptions.find((option) => option.value === sort)?.icon ?? Search;
  return <Icon className="h-4 w-4" aria-hidden="true" />;
}

function sortLabel(sort: string) {
  return sortOptions.find((option) => option.value === sort)?.label ?? formatLabel(sort);
}

function sameQuery(left: AssetListQuery, right: AssetListQuery) {
  return (left.q ?? "") === (right.q ?? "") && (left.type ?? "") === (right.type ?? "") && (left.tag ?? "") === (right.tag ?? "") && (left.category ?? "") === (right.category ?? "") && (left.slot ?? "") === (right.slot ?? "") && (left.sort ?? "") === (right.sort ?? "") && (left.page ?? 1) === (right.page ?? 1);
}
