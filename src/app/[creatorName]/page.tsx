import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppFrame from "../app-frame";
import { CreatorProfile } from "../../page/CreatorProfile";
import { getPublicCreator } from "../../lib/api/workshop";
import { absoluteUrl } from "../../lib/seo";

interface PageProps {
  params: Promise<{ creatorName: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { creatorName } = await params;
  const creator = await loadCreator(creatorName);
  if (!creator) return {};

  const name = creator.profile?.displayName || creator.displayName;
  const description = creator.profile?.description || `${name}'s AoTTG2 Workshop portfolio.`;
  const path = `/creator/${encodeURIComponent(creator.creatorName)}`;
  return {
    title: `${name} | AoTTG2 Workshop`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${name} | AoTTG2 Workshop`,
      description,
      url: absoluteUrl(path),
      siteName: "AoTTG2 Workshop",
      images: [{ url: absoluteUrl("/og/workshop.png"), alt: `${name} portfolio` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | AoTTG2 Workshop`,
      description,
      images: [{ url: absoluteUrl("/og/workshop.png"), alt: `${name} portfolio` }],
    },
  };
}

export default async function CreatorPage({ params }: PageProps) {
  const { creatorName } = await params;
  const creator = await loadCreator(creatorName);
  if (!creator) notFound();

  return (
    <AppFrame>
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
