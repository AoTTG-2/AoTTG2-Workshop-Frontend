import type { WorkshopVariantOption } from "@/lib/api/workshop";
import { WORKSHOP_STATIC_API_ORIGIN } from "@/lib/config";

export function toCatalogOption(id: string): WorkshopVariantOption {
  return { id, label: id, previewUrl: `/workshop/catalog/human/previews/${id}.webp` };
}

export function previewUrl(path: string | null | undefined) {
  return path ? `${WORKSHOP_STATIC_API_ORIGIN}${path}` : "";
}

export function variantNumber(id: string) {
  return id.match(/(\d+)$/)?.[1] ?? "";
}

export function variantGroup(id: string) {
  if (/^[A-Za-z]+M\d+$/.test(id)) return "Male";
  if (/^[A-Za-z]+F\d+$/.test(id)) return "Female";
  return "";
}

export function variantDisplayLabel(option: WorkshopVariantOption) {
  const group = variantGroup(option.id);
  const number = variantNumber(option.id);
  if (group && number) return `${group} ${number}`;

  const prefix = option.id.replace(/\d+$/, "");
  return number ? `${prefix} ${number}` : option.label || option.id;
}
