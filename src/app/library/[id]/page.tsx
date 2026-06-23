import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppFrame from "../../app-frame";
import { AssetDetail } from "../../../page/AssetDetail";
import { assetPath, getAsset } from "../../../lib/api/workshop";
import { assetJsonLd, assetMetadata, safeJsonLd } from "../../../lib/seo";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const asset = await loadAsset(id);
  if (!asset) return {};
  return assetMetadata(asset, assetPath(asset));
}

export default async function LegacyAssetPage({ params }: PageProps) {
  const { id } = await params;
  const asset = await loadAsset(id);
  if (!asset) notFound();
  const canonicalPath = assetPath(asset);
  if (canonicalPath !== `/library/${id}`) redirect(canonicalPath);
  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(assetJsonLd(asset)) }} />
      <AssetDetail id={id} initialAsset={asset} />
    </AppFrame>
  );
}

async function loadAsset(id: string) {
  try {
    return await getAsset(id);
  } catch {
    return null;
  }
}
