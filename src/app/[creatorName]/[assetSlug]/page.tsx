import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppFrame from "../../app-frame";
import { AssetDetail } from "../../../page/AssetDetail";
import { assetPath, getAssetBySeoPath } from "../../../lib/api/workshop";
import { assetJsonLd, assetMetadata, safeJsonLd } from "../../../lib/seo";

interface PageProps {
  params: Promise<{ creatorName: string; assetSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { creatorName, assetSlug } = await params;
  const asset = await loadAsset(creatorName, assetSlug);
  if (!asset) return {};
  return assetMetadata(asset, assetPath(asset));
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
