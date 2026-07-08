import { clearTokens, getAccessToken } from "../../../auth/storage";
import { refreshSession } from "../../../auth/api";
import { WORKSHOP_API_BASE_URL, WORKSHOP_CONTENT_API_BASE_URL } from "../../config";

export interface ApiError {
  error?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export function authHeaders(accessToken?: string | null) {
  return accessToken ? { authorization: `Bearer ${accessToken}` } : undefined;
}

export async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export async function workshopJsonFrom<T>(baseUrl: string, path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init);

  if (response.status === 401 && retry) {
    if (await refreshSession()) {
      const nextToken = getAccessToken();
      return workshopJsonFrom<T>(baseUrl, path, {
        ...init,
        headers: { ...(init.headers as Record<string, string> | undefined), authorization: `Bearer ${nextToken}` },
      }, false);
    }
  }

  if (response.status === 401) {
    clearTokens();
    throw new Error("Sign in required.");
  }

  if (!response.ok) {
    const data = await parseJson<ApiError>(response);
    const validationMessage = Object.values(data.errors ?? {}).flat()[0];
    throw new Error(data.error || data.detail || validationMessage || data.title || fallbackWorkshopError(response.status));
  }

  return parseJson<T>(response);
}

export async function workshopJson<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  return workshopJsonFrom<T>(WORKSHOP_CONTENT_API_BASE_URL, path, init, retry);
}

export async function workshopApiJson<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  return workshopJsonFrom<T>(WORKSHOP_API_BASE_URL, path, init, retry);
}

export function jsonAuthInit(method: string, accessToken: string, body?: unknown): RequestInit {
  return {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export function fallbackWorkshopError(status: number) {
  if (status === 400) return "Check the fields and try again.";
  if (status === 404) return "This item is unavailable.";
  if (status === 429) return "Slow down and try again in a moment.";
  if (status >= 500) return "Workshop server error. Try again later.";
  return "Workshop request failed.";
}
