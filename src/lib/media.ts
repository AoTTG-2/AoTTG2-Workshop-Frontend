const IMGUR_THUMBNAIL_SUFFIXES = new Set(["s", "b", "t", "m", "l", "h"]);

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
