import { notFound, redirect } from "next/navigation";
import { assetPath, getAsset } from "../../../../lib/api/workshop";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyAssetEditPage({ params }: PageProps) {
  const { id } = await params;
  const asset = await loadAsset(id);
  if (!asset) notFound();
  redirect(`${assetPath(asset)}/edit`);
}

async function loadAsset(id: string) {
  try {
    return await getAsset(id);
  } catch {
    return null;
  }
}
