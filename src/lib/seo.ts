import type { Metadata } from "next";
import type { WorkshopAsset, WorkshopMedia } from "./api/workshop";

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
  return truncate(asset.shortDescription || stripMarkdown(asset.descriptionMarkdown || "") || `${asset.title} on AoTTG2 Workshop.`, 160);
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
  };
}

export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function mediaAlt(media: WorkshopMedia, fallback: string) {
  return media.description || fallback;
}

function assetPreviewMedia(asset: WorkshopAsset) {
  return asset.media.find((item) => item.kind.toLowerCase() === "thumbnail") ?? asset.media[0];
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;
}
