import type { WorkshopMedia } from "@/lib/api/workshop";

export function mediaForGallery(media: WorkshopMedia[]) {
  const unique = new Map<string, WorkshopMedia>();
  for (const item of media) {
    if (!unique.has(item.url)) unique.set(item.url, item);
  }
  return Array.from(unique.values());
}
