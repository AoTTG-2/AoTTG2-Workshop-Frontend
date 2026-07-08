import type { Metadata } from "next";
import AppFrame from "../app-frame";
import { LibraryView } from "../library/library-view";
import { type AssetListQuery, type AssetListResponse } from "../../lib/api/workshop";
import { absoluteUrl, safeJsonLd } from "../../lib/seo";
import { listAssetsByTypes } from "../../lib/workshop/asset-groups";
import { isSkinAssetType, SKIN_ASSET_TYPES } from "../../lib/workshop/taxonomy";

const pageSize = 24;

export const metadata: Metadata = {
  title: "Skins | AoTTG2 Workshop",
  description: "Browse AoTTG2 Workshop skins, skin sets, presets, shifters, and skyboxes.",
  alternates: { canonical: "/skins" },
};

export default async function SkinsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = parseSkinQuery(params);
  const { data, error } = await loadSkinAssets(query);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AoTTG2 Workshop Skins",
    url: absoluteUrl("/skins"),
    numberOfItems: data.total,
  };

  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <LibraryView
        initialData={data}
        initialError={error}
        initialQuery={query}
        mode="skins"
        basePath="/skins"
        title="Skins"
        description="Browse AoTTG2 cosmetics: skins, skin sets, presets, shifters, and skyboxes."
        defaultSort="trending"
      />
    </AppFrame>
  );
}

function parseSkinQuery(params: Record<string, string | string[] | undefined>): AssetListQuery & { page: number; pageSize: number } {
  const type = single(params.type) ?? "";
  return {
    q: single(params.q) ?? "",
    type: isSkinAssetType(type) ? type : "",
    tag: single(params.tag) ?? "",
    category: single(params.category) ?? "",
    slot: single(params.slot) ?? "",
    target: single(params.target) ?? "",
    sort: single(params.sort) ?? "trending",
    page: Math.max(1, Number(single(params.page) ?? "1") || 1),
    pageSize,
  };
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function loadSkinAssets(query: AssetListQuery): Promise<{ data: AssetListResponse; error: boolean }> {
  try {
    return { data: await listAssetsByTypes(SKIN_ASSET_TYPES, query), error: false };
  } catch {
    return { data: { total: 0, page: query.page ?? 1, pageSize, assets: [] }, error: true };
  }
}
