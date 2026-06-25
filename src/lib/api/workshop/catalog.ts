import { WORKSHOP_CONTENT_API_BASE_URL } from "../../config";
import { parseJson, workshopJson } from "./http";
import type { TagSuggestionResponse, VariantCatalog } from "./types";

export async function getVariantCatalog(): Promise<VariantCatalog> {
  const response = await fetch(`${WORKSHOP_CONTENT_API_BASE_URL}/variants`);

  if (!response.ok) {
    throw new Error("Failed to load variants");
  }

  return parseJson<VariantCatalog>(response);
}

export async function listTagSuggestions(q = "", limit = 8): Promise<TagSuggestionResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (q.trim()) params.set("q", q.trim());
  return workshopJson<TagSuggestionResponse>(`/tags?${params.toString()}`);
}
