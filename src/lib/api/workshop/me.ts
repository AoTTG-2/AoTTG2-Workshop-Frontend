import { clearTokens } from "../../../auth/storage";
import { WORKSHOP_API_BASE_URL } from "../../config";
import { fallbackWorkshopError, jsonAuthInit, parseJson, type ApiError } from "./http";
import type { WorkshopUser } from "./types";

export async function getWorkshopMe(accessToken: string): Promise<WorkshopUser | null> {
  const response = await fetch(`${WORKSHOP_API_BASE_URL}/me`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load Workshop user");
  }

  return parseJson<WorkshopUser>(response);
}

export async function setCreatorName(accessToken: string, creatorName: string): Promise<WorkshopUser> {
  const response = await fetch(`${WORKSHOP_API_BASE_URL}/me/creator-name`, jsonAuthInit("PUT", accessToken, { creatorName }));

  if (response.status === 401) {
    clearTokens();
    throw new Error("Sign in required.");
  }

  if (!response.ok) {
    const data = await parseJson<ApiError>(response);
    const validationMessage = Object.values(data.errors ?? {}).flat()[0];
    throw new Error(data.error || data.detail || validationMessage || data.title || fallbackWorkshopError(response.status));
  }

  return parseJson<WorkshopUser>(response);
}
