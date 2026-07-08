import type { MetadataRoute } from "next";
import { assetPath, listAssets } from "../lib/api/workshop";
import { LEGAL_PAGES, legalHref } from "../lib/legal";
import { absoluteUrl } from "../lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/discover"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/skins"), changeFrequency: "daily", priority: 0.85 },
    { url: absoluteUrl("/experiences"), changeFrequency: "daily", priority: 0.85 },
    { url: absoluteUrl("/creators"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/legal"), changeFrequency: "monthly", priority: 0.5 },
    ...LEGAL_PAGES.map((page) => ({ url: absoluteUrl(legalHref(page.slug)), changeFrequency: "monthly" as const, priority: 0.5 })),
  ];

  try {
    const data = await listAssets({ pageSize: 100 });
    const creatorNames = [...new Set(data.assets.map((asset) => asset.creatorName).filter(Boolean))];
    routes.push(
      ...creatorNames.map((creatorName) => ({
        url: absoluteUrl(`/${encodeURIComponent(creatorName)}`),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );
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
