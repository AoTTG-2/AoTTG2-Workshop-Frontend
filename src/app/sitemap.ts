import type { MetadataRoute } from "next";
import { assetPath, listAssets } from "../lib/api/workshop";
import { absoluteUrl } from "../lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/library"), changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const data = await listAssets({ pageSize: 100 });
    routes.push(
      ...data.assets.map((asset) => ({
        url: absoluteUrl(assetPath(asset)),
        lastModified: asset.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    );
  } catch {
    // ponytail: API can be offline during build; static routes still matter.
  }

  return routes;
}
