import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppFrame from "../../../app-frame";
import { CreateAsset } from "../../../../page/CreateAsset";
import { getAssetBySeoPath } from "../../../../lib/api/workshop";

interface PageProps {
  params: Promise<{ creatorName: string; assetSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { creatorName, assetSlug } = await params;
  const asset = await loadAsset(creatorName, assetSlug);
  return {
    title: asset ? `Edit ${asset.title} | AoTTG2 Workshop` : "Edit Asset | AoTTG2 Workshop",
    robots: { index: false, follow: false },
  };
}

export default async function AssetEditPage({ params }: PageProps) {
  const { creatorName, assetSlug } = await params;
  const asset = await loadAsset(creatorName, assetSlug);
  if (!asset) notFound();

  return (
    <AppFrame requireAuth>
      <CreateAsset mode="edit" initialAsset={asset} />
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
