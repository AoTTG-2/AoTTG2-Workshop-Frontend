import type { Metadata } from "next";
import AppFrame from "../app-frame";
import { absoluteUrl, safeJsonLd } from "../../lib/seo";
import { loadDiscoverData } from "../../lib/workshop/discover";
import { DiscoverView } from "./discover-view";

export const metadata: Metadata = {
  title: "Discover | AoTTG2 Workshop",
  description: "Discover popular and new AoTTG2 Workshop skins, maps, custom logic, and addons.",
  alternates: { canonical: "/discover" },
};

export const revalidate = 300;

export default async function DiscoverPage() {
  const data = await loadDiscoverData();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AoTTG2 Workshop Discover",
    url: absoluteUrl("/discover"),
    description: "Popular and new AoTTG2 Workshop skins, maps, custom logic, and addons.",
    hasPart: [
      "New Uploads",
      "Featured Skins",
      "Featured Experiences",
      "Trending Experiences",
      "New Skins",
      "New Experiences",
    ],
  };

  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <DiscoverView data={data} />
    </AppFrame>
  );
}
