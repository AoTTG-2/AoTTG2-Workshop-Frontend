import { z } from "zod";
import type { VariantCatalog } from "@/lib/api/workshop";
import { fallbackCatalog } from "./constants";
import { mediaUrls, normalizeSlug, splitList } from "./form-utils";

export const httpUrl = z
  .string()
  .trim()
  .url("Use a valid URL")
  .refine((value) => value.startsWith("http://") || value.startsWith("https://"), "Use an http(s) URL");

export const commonSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    assetSlug: z.string().trim().optional(),
    descriptionMarkdown: z.string().trim().optional(),
    shortDescription: z.string().trim().max(144, "Short description must be 144 characters or less").optional(),
    thumbnailUrl: z.string().trim(),
    galleryUrls: z.string().trim(),
    tags: z.string().trim().optional(),
  })
  .superRefine((common, ctx) => {
    const assetSlug = common.assetSlug?.trim();
    const normalizedAssetSlug = normalizeSlug(assetSlug);
    if (assetSlug && (!normalizedAssetSlug || normalizedAssetSlug.length > 120)) {
      ctx.addIssue({ code: "custom", path: ["assetSlug"], message: "Slug must include letters or numbers and stay under 120 characters" });
    }

    for (const [index, url] of mediaUrls(common).entries()) {
      const result = httpUrl.safeParse(url);
      if (!result.success) {
        ctx.addIssue({ code: "custom", path: [index === 0 ? "thumbnailUrl" : "galleryUrls"], message: "Media URLs must be valid http(s) URLs" });
      }
    }
  });

export const itemSchema = z.object({
  slot: z.string().min(1, "Slot is required"),
  textureUrl: z.string().trim().optional().default(""),
  textureUrls: z.object({ left: z.string().trim(), right: z.string().trim() }).optional(),
  variants: z.array(z.string()),
  hookTiling: z.string().trim().optional(),
  hookTilings: z.object({ left: z.string().trim(), right: z.string().trim() }).optional(),
  boots: z.boolean().optional(),
  mirror: z.boolean().optional(),
});

export const skinPartSchema = commonSchema.extend({
  slot: z.string().min(1, "Slot is required"),
  textureUrl: z.string().trim().optional().default(""),
  textureUrls: z.object({ left: z.string().trim(), right: z.string().trim() }).optional(),
  variants: z.array(z.string()),
  hookTiling: z.string().trim().optional(),
  hookTilings: z.object({ left: z.string().trim(), right: z.string().trim() }).optional(),
  boots: z.boolean().optional(),
  mirror: z.boolean().optional(),
});

export function validateListingMedia(common: { thumbnailUrl: string }) {
  if (!common.thumbnailUrl.trim()) throw new Error("Thumbnail URL is required");
  httpUrl.parse(common.thumbnailUrl);
}

export function validatePublishMedia(common: { thumbnailUrl: string; galleryUrls: string }) {
  validateListingMedia(common);
  const galleryUrls = splitList(common.galleryUrls);
  if (galleryUrls.length === 0) throw new Error("Add at least one gallery image");
  galleryUrls.forEach((url) => httpUrl.parse(url));
}

function catalogTextureAllowlist(catalog: VariantCatalog) {
  return (catalog.textureUrlAllowlist?.length ? catalog.textureUrlAllowlist : fallbackCatalog.textureUrlAllowlist ?? [])
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .map(stripTexturePrefix);
}

function stripTexturePrefix(value: string) {
  let next = value;
  for (const prefix of ["https://", "http://", "www."]) {
    if (next.startsWith(prefix)) next = next.slice(prefix.length);
  }
  return next;
}

export function validateTextureUrl(value: string, catalog: VariantCatalog) {
  const lower = value.trim().toLowerCase();
  if (!httpUrl.safeParse(lower).success) throw new Error("Texture URL must be a valid http(s) URL");

  const extensions = catalog.textureFileExtensions?.length ? catalog.textureFileExtensions : fallbackCatalog.textureFileExtensions ?? [".jpg", ".png", ".jpeg"];
  if (!extensions.some((extension) => lower.endsWith(extension.toLowerCase()))) {
    throw new Error(`Texture URL must end with ${extensions.join(", ")}`);
  }

  const normalized = stripTexturePrefix(lower);
  if (!catalogTextureAllowlist(catalog).some((entry) => normalized.startsWith(entry))) {
    throw new Error("Texture URL host is not allowed for Workshop skins");
  }
}
