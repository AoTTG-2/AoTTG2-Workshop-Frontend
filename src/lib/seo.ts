import type { Metadata } from "next";
import type { PublicCreator, WorkshopAsset, WorkshopMedia } from "./api/workshop";

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "https://workshop.aottg2.com");

function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function stripMarkdown(value = "") {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function assetDescription(asset: WorkshopAsset) {
  const base = asset.shortDescription || stripMarkdown(asset.descriptionMarkdown || "") || `${asset.title} on AoTTG2 Workshop.`;
  return descriptionWithStats(base, assetStats(asset), 200);
}

export function assetImage(asset: WorkshopAsset) {
  const media = assetPreviewMedia(asset);
  return media?.url ? absoluteUrl(media.url) : absoluteUrl("/og/workshop.png");
}

export function assetMetadata(asset: WorkshopAsset, path: string): Metadata {
  const title = `${asset.title} | AoTTG2 Workshop`;
  const description = assetDescription(asset);
  const author = asset.authorDisplayName || asset.creatorName;
  const image = {
    url: assetImage(asset),
    alt: assetPreviewMedia(asset)?.description || asset.title,
  };

  return {
    title,
    description,
    authors: [{ name: author }],
    creator: author,
    publisher: "AoTTG2 Workshop",
    keywords: asset.tags,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title,
      description,
      url: absoluteUrl(path),
      siteName: "AoTTG2 Workshop",
      images: [image],
      authors: [author],
      publishedTime: asset.createdAt,
      modifiedTime: asset.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: `@${asset.creatorName}`,
    },
  };
}

export function creatorDescription(creator: PublicCreator) {
  const name = creator.profile?.displayName || creator.displayName;
  const base = creator.profile?.description || `${name}'s AoTTG2 Workshop portfolio.`;
  return descriptionWithStats(base, creatorStats(creator), 200);
}

export function creatorMetadata(creator: PublicCreator, path: string): Metadata {
  const name = creator.profile?.displayName || creator.displayName;
  const title = `${name} | AoTTG2 Workshop`;
  const description = creatorDescription(creator);
  const image = {
    url: absoluteUrl(`${path}/opengraph-image`),
    alt: `${name} Workshop profile`,
  };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      title,
      description,
      url: absoluteUrl(path),
      siteName: "AoTTG2 Workshop",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ ...image, url: absoluteUrl(`${path}/twitter-image`) }],
    },
  };
}

export function assetJsonLd(asset: WorkshopAsset) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: asset.title,
    description: assetDescription(asset),
    image: assetImage(asset),
    author: {
      "@type": "Person",
      name: asset.authorDisplayName || asset.creatorName,
    },
    dateCreated: asset.createdAt,
    dateModified: asset.updatedAt,
    keywords: asset.tags.join(", "),
    interactionStatistic: [
      interaction("DownloadAction", asset.engagement?.downloadCount ?? 0),
      interaction("LikeAction", asset.engagement?.likeCount ?? 0),
      interaction("CommentAction", asset.engagement?.commentCount ?? 0),
    ],
  };
}

export function creatorJsonLd(creator: PublicCreator) {
  const name = creator.profile?.displayName || creator.displayName;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${name} | AoTTG2 Workshop`,
    description: creatorDescription(creator),
    mainEntity: {
      "@type": "Person",
      name,
      alternateName: creator.creatorName,
      interactionStatistic: [
        interaction("FollowAction", creator.followerCount ?? 0),
        interaction("DownloadAction", creator.stats.downloadCount),
        interaction("LikeAction", creator.stats.likeCount),
      ],
    },
  };
}

export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function mediaAlt(media: WorkshopMedia, fallback: string) {
  return media.description || fallback;
}

export function compactCount(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function creatorInitials(creator: PublicCreator) {
  const name = creator.profile?.displayName || creator.displayName || creator.creatorName;
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
}

function assetPreviewMedia(asset: WorkshopAsset) {
  return asset.media.find((item) => item.kind.toLowerCase() === "thumbnail") ?? asset.media[0];
}

function assetStats(asset: WorkshopAsset) {
  const engagement = asset.engagement;
  if (!engagement) return "";
  return `${compactCount(engagement.downloadCount)} downloads, ${compactCount(engagement.likeCount)} thanks, ${compactCount(engagement.commentCount)} comments`;
}

function creatorStats(creator: PublicCreator) {
  return `${compactCount(creator.stats.assetCount)} assets, ${compactCount(creator.stats.downloadCount)} downloads, ${compactCount(creator.stats.likeCount)} thanks, ${compactCount(creator.followerCount ?? 0)} followers`;
}

function descriptionWithStats(base: string, stats: string, max: number) {
  if (!stats) return truncate(base, max);
  const suffix = `${stats}.`;
  const baseMax = Math.max(40, max - suffix.length - 1);
  return `${truncate(base, baseMax)} ${suffix}`;
}

function interaction(type: string, count: number) {
  return {
    "@type": "InteractionCounter",
    interactionType: `https://schema.org/${type}`,
    userInteractionCount: count,
  };
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;
}
