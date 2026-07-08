"use client";

import { useQuery } from "@tanstack/react-query";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input } from "@aottg2/ui";
import { Box, CalendarDays, ChevronDown, Download, Eye, Glasses, Grid3X3, Hammer, HardHat, Image, Palette, ScanFace, Search, Shirt, Sparkles, Swords, ThumbsUp, UploadCloud, User, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { BrowseAssetGrid, BrowseSectionSkeleton, BrowseSectionState } from "../../components/BrowseSection";
import { Pagination } from "../../components/Pagination";
import { SideCard } from "../../components/SideCard";
import { WorkshopAssetCard } from "../../components/WorkshopAssetCard";
import { assetPath, listAssets, type AssetListQuery, type AssetListResponse } from "../../lib/api/workshop";
import { toast } from "../../lib/toast";
import { listAssetsByTypes } from "../../lib/workshop/asset-groups";
import { EXPERIENCE_TYPE_FILTERS, isSkinAssetType, SKIN_ASSET_TYPES } from "../../lib/workshop/taxonomy";

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
const categoryFilters: Array<{ label: string; category?: string; type?: string; icon: typeof User }> = [
  { label: "Human", category: "human", icon: User },
  { label: "Shifter", category: "shifter", icon: Zap },
  { label: "Skybox", category: "skybox", icon: Image },
  ...EXPERIENCE_TYPE_FILTERS.map((item) => ({ label: item.label, type: item.type, icon: item.icon })),
];
const skinCategoryFilters = categoryFilters.filter((item) => !item.type);
const humanParts = [
  { slot: "Hair", label: "Hair" },
  { slot: "Eye", label: "Eyes" },
  { slot: "Glass", label: "Glasses" },
  { slot: "Face", label: "Face" },
  { slot: "Skin", label: "Body Skin" },
  { slot: "Costume", label: "Costume" },
  { slot: "Logo", label: "Cape Logo" },
  { slot: "Blades", label: "Blades" },
  { slot: "AHSS", label: "AHSS" },
  { slot: "APG", label: "APG" },
  { slot: "Gas", label: "Gas Smoke" },
  { slot: "Hoodie", label: "Hoodie" },
  { slot: "WeaponTrail", label: "Blade Trail" },
  { slot: "Horse", label: "Horse" },
  { slot: "Thunderspears", label: "Thunderspears" },
  { slot: "Hooks", label: "Hooks" },
  { slot: "Hat", label: "Hat" },
  { slot: "Head", label: "Head Accessory" },
  { slot: "Back", label: "Back Accessory" },
];
const humanPartIcons = {
  Hair: Sparkles,
  Eye,
  Glass: Glasses,
  Face: ScanFace,
  Skin: User,
  Costume: Shirt,
  Logo: Palette,
  Blades: Box,
  AHSS: Box,
  APG: Box,
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
const shifterTargets = [
  { label: "Eren", target: "eren" },
  { label: "Annie", target: "annie" },
  { label: "Colossal", target: "colossal" },
];

interface LibraryViewProps {
  initialData: AssetListResponse;
  initialQuery: AssetListQuery & { page: number; pageSize: number };
  initialError: boolean;
  mode?: "library" | "skins";
  basePath?: string;
  title?: string;
  description?: string;
  defaultSort?: string;
}

export function LibraryView({
  initialData,
  initialError,
  initialQuery,
  mode = "library",
  basePath = "/library",
  title = "Library",
  description = "Browse shared AoTTG2 skins, sets, maps, and custom logic.",
  defaultSort = "relevance",
}: LibraryViewProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const q = searchParams.get("q") ?? "";
  const requestedType = searchParams.get("type") ?? "";
  const type = mode === "skins" && !isSkinAssetType(requestedType) ? "" : requestedType;
  const tag = searchParams.get("tag") ?? "";
  const category = searchParams.get("category") ?? "";
  const slot = searchParams.get("slot") ?? "";
  const target = searchParams.get("target") ?? "";
  const sort = searchParams.get("sort") ?? defaultSort;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const filters = mode === "skins" ? skinCategoryFilters : categoryFilters;
  const humanTypeActive = type === "skin_part" || type === "skin_set" || Boolean(slot);
  const isHumanBrowsing = category === "human" || (!category && humanTypeActive);
  const showHumanParts = isHumanBrowsing || (!category && !type && !slot && !target);
  const showShifterTypes = category === "shifter";
  const effectiveCategory = isHumanBrowsing ? "human" : category;
  const effectiveType = type;
  const effectiveSlot = isHumanBrowsing ? slot : "";
  const effectiveTarget = showShifterTypes ? target : "";
  const [searchText, setSearchText] = useState(q);

  useEffect(() => {
    setSearchText(q);
  }, [q]);

  const query = useQuery({
    queryKey: ["workshop", "assets", mode, { q, type: effectiveType, tag, category: effectiveCategory, slot: effectiveSlot, target: effectiveTarget, sort, page, pageSize }],
    queryFn: () => {
      const browseQuery = { q, type: effectiveType, tag, category: effectiveCategory, slot: normalizeSlotParam(effectiveSlot), target: effectiveTarget, sort, page, pageSize };
      return mode === "skins" ? listAssetsByTypes(SKIN_ASSET_TYPES, browseQuery) : listAssets(browseQuery);
    },
    initialData: sameQuery(initialQuery, { q, type: effectiveType, tag, category: effectiveCategory, slot: effectiveSlot, target: effectiveTarget, sort, page, pageSize }) && !initialError ? initialData : undefined,
  });

  useEffect(() => {
    if (query.error) {
      toast.error("Could not load library", { description: query.error instanceof Error ? query.error.message : "Try again." });
    }
  }, [query.error]);

  function handleAddAsset() {
    router.push(isAuthenticated ? "/library/publish" : "/login?next=%2Flibrary%2Fpublish");
  }

  function updateParams(next: { q?: string; type?: string; tag?: string; category?: string; slot?: string; target?: string; sort?: string; page?: number }) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === "" || value === undefined || value === 1 || (key === "sort" && value === "relevance")) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    if (next.q !== undefined || next.type !== undefined || next.tag !== undefined || next.category !== undefined || next.slot !== undefined || next.target !== undefined || next.sort !== undefined) {
      params.delete("page");
    }
    router.push(`${basePath}${params.size ? `?${params}` : ""}`);
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
          <h1 className="font-primary text-balance text-3xl font-semibold uppercase leading-none tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground">{description}</p>
        </div>
        <Button className="min-h-10 transition-transform active:scale-[0.96]" onClick={handleAddAsset}>
          <UploadCloud className="h-4 w-4" aria-hidden="true" />
          PUBLISH ASSET
        </Button>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <motion.aside className="grid content-start gap-4" initial={motionInitial(reduceMotion, 8)} animate={motionAnimate} transition={motionTransition(0.03)}>
          <SideCard title="Category" contentClassName="grid gap-1 p-2">
            <SideFilterItem active={!category && !type && !slot && !target} icon={<Grid3X3 className="h-4 w-4" />} label="All content" onClick={() => updateParams({ category: "", type: "", slot: "", target: "", page: 1 })} />
            {filters.map((item) => (
              <SideFilterItem
                key={item.label}
                active={Boolean((item.category && effectiveCategory === item.category && !effectiveSlot && !effectiveTarget) || (item.type && type === item.type))}
                icon={<item.icon className="h-4 w-4" />}
                label={item.label}
                onClick={() => updateParams({ category: item.category ?? "", type: item.type ?? "", slot: "", target: "", page: 1 })}
              />
            ))}
          </SideCard>

          {showHumanParts ? (
            <SideCard title="Human Parts" variant="secondary" contentClassName="grid gap-1 p-2">
              {humanParts.map((part) => (
                <SideFilterItem key={part.slot} active={effectiveCategory === "human" && effectiveSlot === part.slot} icon={renderHumanPartIcon(part.slot)} label={part.label} onClick={() => updateParams({ category: "human", type: "", slot: part.slot, page: 1 })} />
              ))}
            </SideCard>
          ) : null}
          {showShifterTypes ? (
            <SideCard title="Shifter Type" variant="secondary" contentClassName="grid gap-1 p-2">
              {shifterTargets.map((item) => (
                <SideFilterItem key={item.target} active={effectiveTarget === item.target} icon={<Zap className="h-4 w-4" />} label={item.label} onClick={() => updateParams({ category: "shifter", type: "", slot: "", target: item.target, page: 1 })} />
              ))}
            </SideCard>
          ) : null}
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
              {isHumanBrowsing ? (
                <div className="flex flex-wrap gap-2">
                  {typeFilters.map((filter) => (
                    <Button key={filter.label} type="button" variant={effectiveType === filter.value ? "default" : "ghost"} onClick={() => updateParams({ category: "human", type: filter.value, slot: "", page: 1 })}>
                      {filter.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <div />
              )}
              <div className="flex flex-wrap gap-2">
                {tag ? <ActivePill label={`Tag: ${tag}`} onClear={() => updateParams({ tag: "", page: 1 })} /> : null}
                {effectiveCategory ? <ActivePill label={`Category: ${formatLabel(effectiveCategory)}`} onClear={() => updateParams({ category: "", type: "", slot: "", target: "", page: 1 })} /> : null}
                {effectiveSlot ? <ActivePill label={`Part: ${effectiveSlot}`} onClear={() => updateParams({ slot: "", page: 1 })} /> : null}
                {effectiveTarget ? <ActivePill label={`Shifter: ${formatLabel(effectiveTarget)}`} onClear={() => updateParams({ target: "", page: 1 })} /> : null}
              </div>
            </div>
          </motion.div>

          {query.isLoading ? <BrowseSectionSkeleton /> : null}
          {query.isError ? <BrowseSectionState title="Library unavailable" message="Assets could not be loaded. Check the Workshop API and try again." /> : null}
          {query.data && query.data.assets.length === 0 ? <BrowseSectionState title="No assets found" message="Try a different search, category, part, or tag filter." /> : null}
          {query.data && query.data.assets.length > 0 ? (
            <>
              <motion.div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground" initial={motionInitial(reduceMotion, 6)} animate={motionAnimate} transition={motionTransition(0.09)}>
                <span>Showing {query.data.assets.length} of {query.data.total} assets</span>
                <span>{sortLabel(sort)} first</span>
              </motion.div>
              <BrowseAssetGrid
                assets={query.data.assets}
                renderAsset={(asset, index) => (
                  <motion.div key={asset.id} className="relative z-0 hover:z-50 focus-within:z-50" initial={motionInitial(reduceMotion, 10)} animate={motionAnimate} transition={motionTransition(Math.min(index, 12) * 0.025)}>
                    <WorkshopAssetCard asset={asset} onOpen={() => router.push(assetPath(asset))} onTagSelect={(nextTag) => updateParams({ tag: nextTag, page: 1 })} />
                  </motion.div>
                )}
              />
              <motion.div className="mt-8" initial={motionInitial(reduceMotion, 6)} animate={motionAnimate} transition={motionTransition(0.12)}>
                <Pagination page={page} total={query.data.total} pageSize={pageSize} onPage={(nextPage) => updateParams({ page: nextPage })} />
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

function normalizeSlotParam(value: string) {
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
  return (left.q ?? "") === (right.q ?? "") && (left.type ?? "") === (right.type ?? "") && (left.tag ?? "") === (right.tag ?? "") && (left.category ?? "") === (right.category ?? "") && (left.slot ?? "") === (right.slot ?? "") && (left.target ?? "") === (right.target ?? "") && (left.sort ?? "") === (right.sort ?? "") && (left.page ?? 1) === (right.page ?? 1);
}
