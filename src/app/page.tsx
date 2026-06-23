import type { Metadata } from "next";
import AppFrame from "./app-frame";
import { HomeView } from "./home-view";
import { listAssets, type WorkshopAsset } from "../lib/api/workshop";
import { absoluteUrl, safeJsonLd } from "../lib/seo";

export const metadata: Metadata = {
  title: "AoTTG2 Workshop | Browse AoTTG2 Skins, Maps, And Logic",
  description: "Find and publish AoTTG2 skins, skin sets, maps, and custom logic from community creators.",
  alternates: { canonical: "/" },
};

export const revalidate = 300;

export default async function HomePage() {
  const [trending, popular] = await Promise.all([loadAssets("trending"), loadAssets("popular")]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AoTTG2 Workshop",
    url: absoluteUrl("/"),
    description: "Browse and import AoTTG2 skins, skin sets, maps, and custom logic shared by the community.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/library")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <HomeView trending={trending} popular={popular} />
    </AppFrame>
  );
}

async function loadAssets(sort: "trending" | "popular"): Promise<WorkshopAsset[]> {
  try {
    const data = await listAssets({ sort, pageSize: 8 });
    return data.assets;
  } catch {
    // ponytail: API can be offline during build; homepage still has useful static content.
    return [];
  }
}
