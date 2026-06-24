const IMGUR_THUMBNAIL_SUFFIXES = new Set(["s", "b", "t", "m", "l", "h"]);

interface ThumbnailDisplayOptions {
  width: number;
  height?: number;
  fit?: "cover" | "inside";
}

export function thumbnailDisplayUrls(url: string, options: ThumbnailDisplayOptions) {
  const parsed = parseUrl(url);
  if (!parsed || !["http:", "https:"].includes(parsed.protocol)) return [url];

  const wsrvUrl = wsrvThumbnailUrl(url, options);
  const imgurUrl = thumbnailDisplayUrl(url);
  return unique([wsrvUrl, imgurUrl, url]);
}

export function thumbnailDisplayUrl(url: string) {
  const parsed = parseUrl(url);
  if (!parsed || parsed.hostname !== "i.imgur.com") return url;

  const match = parsed.pathname.match(/^(.*\/)([^/.]+)(\.(?:jpe?g|png|webp))$/i);
  if (!match) return url;

  const [, directory, imageId, extension] = match;
  const suffix = imageId.at(-1)?.toLowerCase();
  // ponytail: ambiguous Imgur IDs ending in a thumbnail suffix are left alone to avoid double-suffixing.
  if (suffix && IMGUR_THUMBNAIL_SUFFIXES.has(suffix)) return url;

  parsed.pathname = `${directory}${imageId}m${extension}`;
  return parsed.toString();
}

function parseUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function wsrvThumbnailUrl(url: string, { width, height, fit = "cover" }: ThumbnailDisplayOptions) {
  const params = new URLSearchParams({
    url,
    w: String(width),
    fit,
    output: "webp",
    q: "80",
  });
  if (height) params.set("h", String(height));
  return `https://wsrv.nl/?${params.toString()}`;
}

function unique(values: string[]) {
  return [...new Set(values)];
}
