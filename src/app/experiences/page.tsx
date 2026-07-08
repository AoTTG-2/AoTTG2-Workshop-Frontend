import type { Metadata } from "next";
import AppFrame from "../app-frame";
import { LibraryView } from "../library/library-view";
import { type AssetListQuery, type AssetListResponse } from "../../lib/api/workshop";
import { absoluteUrl, safeJsonLd } from "../../lib/seo";
import { listAssetsByTypes } from "../../lib/workshop/asset-groups";
import { EXPERIENCE_ASSET_TYPES, isExperienceAssetType } from "../../lib/workshop/taxonomy";

const pageSize = 24;

export const metadata: Metadata = {
  title: "Experiences | AoTTG2 Workshop",
  description: "Browse AoTTG2 Workshop maps, custom logic, and addons.",
  alternates: { canonical: "/experiences" },
};

export default async function ExperiencesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = parseExperienceQuery(params);
  const { data, error } = await loadExperienceAssets(query);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AoTTG2 Workshop Experiences",
    url: absoluteUrl("/experiences"),
    numberOfItems: data.total,
  };

  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <LibraryView
        initialData={data}
        initialError={error}
        initialQuery={query}
        mode="experiences"
        basePath="/experiences"
        title="Experiences"
        description="Browse playable and behavior content: maps, custom logic, and addons."
        defaultSort="trending"
      />
    </AppFrame>
  );
}

function parseExperienceQuery(params: Record<string, string | string[] | undefined>): AssetListQuery & { page: number; pageSize: number } {
  const type = single(params.type) ?? "";
  return {
    q: single(params.q) ?? "",
    type: isExperienceAssetType(type) ? type : "",
    tag: single(params.tag) ?? "",
    sort: single(params.sort) ?? "trending",
    page: Math.max(1, Number(single(params.page) ?? "1") || 1),
    pageSize,
  };
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function loadExperienceAssets(query: AssetListQuery): Promise<{ data: AssetListResponse; error: boolean }> {
  try {
    return { data: await listAssetsByTypes(EXPERIENCE_ASSET_TYPES, query), error: false };
  } catch {
    return { data: { total: 0, page: query.page ?? 1, pageSize, assets: [] }, error: true };
  }
}
