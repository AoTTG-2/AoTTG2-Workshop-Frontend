import type { Metadata } from "next";
import AppFrame from "../app-frame";
import { listAssets, type AssetListQuery, type AssetListResponse } from "../../lib/api/workshop";
import { absoluteUrl, safeJsonLd } from "../../lib/seo";
import { LibraryView } from "./library-view";

const pageSize = 24;

export const metadata: Metadata = {
  title: "Library | AoTTG2 Workshop",
  description: "Browse shared AoTTG2 skins, sets, maps, and custom logic.",
  alternates: { canonical: "/library" },
};

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = parseAssetQuery(params);
  const { data, error } = await loadAssets({ ...query, slot: normalizeSlotParam(query.slot ?? "") });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AoTTG2 Workshop Library",
    url: absoluteUrl("/library"),
    numberOfItems: data.total,
  };

  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <LibraryView initialData={data} initialError={error} initialQuery={query} />
    </AppFrame>
  );
}

function parseAssetQuery(params: Record<string, string | string[] | undefined>): AssetListQuery & { page: number; pageSize: number } {
  return {
    q: single(params.q) ?? "",
    type: single(params.type) ?? "",
    tag: single(params.tag) ?? "",
    category: single(params.category) ?? "",
    slot: single(params.slot) ?? "",
    sort: single(params.sort) ?? "relevance",
    page: Math.max(1, Number(single(params.page) ?? "1") || 1),
    pageSize,
  };
}

function normalizeSlotParam(value: string) {
  if (value === "Gear") return "GearL";
  if (value === "Thunderspears") return "ThunderspearL";
  if (value === "Hooks") return "HookL";
  return value;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function loadAssets(query: AssetListQuery): Promise<{ data: AssetListResponse; error: boolean }> {
  try {
    return { data: await listAssets(query), error: false };
  } catch {
    return { data: { total: 0, page: query.page ?? 1, pageSize, assets: [] }, error: true };
  }
}
