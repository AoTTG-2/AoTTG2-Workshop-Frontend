import { clearTokens, getRefreshToken, setTokens } from "./storage";
import type { ApiResult, AuthResponse, ErrorResponse, ProfileResponse } from "./types";
import { AUTH_API_BASE_URL } from "../lib/config";

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(`${AUTH_API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return false;
  }

  const data = await parseJson<AuthResponse>(response);
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

async function request<T = unknown>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<ApiResult<T>> {
  const token = localStorage.getItem("aottg2_access");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${AUTH_API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && retry && (await refreshSession())) {
    return request<T>(path, init, false);
  }

  if (response.status === 401) {
    clearTokens();
  }

  const data = await parseJson<T>(response);
  return { ok: response.ok, data, status: response.status };
}

export const authApi = {
  logout: (refreshToken: string) =>
    request<{ ok?: boolean }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }, false),

  oauthSession: (code: string) =>
    request<AuthResponse & ErrorResponse>(`/auth/oauth/session?code=${encodeURIComponent(code)}`, {}, false),

  getProfile: () => request<ProfileResponse>("/me"),
};
