import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppFrame from "../app-frame";
import { CreatorProfile } from "../../page/CreatorProfile";
import { getPublicCreator } from "../../lib/api/workshop";
import { creatorJsonLd, creatorMetadata, safeJsonLd } from "../../lib/seo";

interface PageProps {
  params: Promise<{ creatorName: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { creatorName } = await params;
  const creator = await loadCreator(creatorName);
  if (!creator) return {};

  const path = `/${encodeURIComponent(creator.creatorName)}`;
  return creatorMetadata(creator, path);
}

export default async function CreatorPage({ params }: PageProps) {
  const { creatorName } = await params;
  const creator = await loadCreator(creatorName);
  if (!creator) notFound();

  return (
    <AppFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(creatorJsonLd(creator)) }} />
      <CreatorProfile creator={creator} />
    </AppFrame>
  );
}

async function loadCreator(creatorName: string) {
  try {
    return await getPublicCreator(creatorName);
  } catch {
    return null;
  }
}
