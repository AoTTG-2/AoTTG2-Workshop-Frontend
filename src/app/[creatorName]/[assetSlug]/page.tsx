import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppFrame from "../../app-frame";
import { AssetDetail } from "../../../page/AssetDetail";
import { getAssetBySeoPath } from "../../../lib/api/workshop";
import { absoluteUrl, assetDescription, assetImage, assetJsonLd, safeJsonLd } from "../../../lib/seo";

interface PageProps {
  params: Promise<{ creatorName: string; assetSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { creatorName, assetSlug } = await params;
  const asset = await loadAsset(creatorName, assetSlug);
  if (!asset) return {};
  const title = `${asset.title} | AoTTG2 Workshop`;
  const description = assetDescription(asset);

  return {
    title,
    description,
    alternates: { canonical: `/${encodeURIComponent(asset.creatorName)}/${encodeURIComponent(asset.assetSlug)}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/${asset.creatorName}/${asset.assetSlug}`),
      images: [assetImage(asset)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [assetImage(asset)],
    },
  };
}

export default async function AssetSeoPage({ params }: PageProps) {
  const { creatorName, assetSlug } = await params;
  const asset = await loadAsset(creatorName, assetSlug);
  if (!asset) notFound();
  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(assetJsonLd(asset)) }} />
      <AssetDetail creatorName={creatorName} assetSlug={assetSlug} initialAsset={asset} />
    </AppFrame>
  );
}

async function loadAsset(creatorName: string, assetSlug: string) {
  try {
    return await getAssetBySeoPath(creatorName, assetSlug);
  } catch {
    return null;
  }
}
