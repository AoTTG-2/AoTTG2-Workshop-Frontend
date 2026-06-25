export function splitList(value: string | undefined) {
  return (value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function mediaUrls(common: { thumbnailUrl: string; galleryUrls: string }) {
  return [common.thumbnailUrl.trim(), ...splitList(common.galleryUrls)].filter(Boolean);
}

export function mediaFromCommon(common: { thumbnailUrl: string; galleryUrls: string }) {
  return [
    ...(common.thumbnailUrl.trim() ? [{ kind: "thumbnail", url: common.thumbnailUrl.trim() }] : []),
    ...splitList(common.galleryUrls).map((url) => ({ kind: "gallery", url })),
  ];
}

export function normalizeSlug(value: string | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
