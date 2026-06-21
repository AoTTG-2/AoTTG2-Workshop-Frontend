import { WORKSHOP_API_BASE_URL } from "../config";

export interface WorkshopUser {
  [key: string]: unknown;
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

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

export async function createAsset(accessToken: string, asset: unknown): Promise<unknown> {
  const response = await fetch(`${WORKSHOP_API_BASE_URL}/assets`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(asset),
  });

  if (response.status === 401) {
    throw new Error("Not logged in");
  }

  if (!response.ok) {
    throw new Error("Create asset failed");
  }

  return parseJson<unknown>(response);
}
