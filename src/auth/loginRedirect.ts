import { AUTH_FRONTEND_LOGIN_URL } from "../lib/config";

export function localPath(raw: string | null, fallback = "/dashboard"): string {
  if (!raw) return fallback;

  try {
    const target = new URL(raw, window.location.origin);
    if (target.origin === window.location.origin) {
      return `${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function websiteLoginUrl(next: string): string {
  const url = new URL(AUTH_FRONTEND_LOGIN_URL);
  url.searchParams.set("next", `${window.location.origin}${next}`);
  return url.href;
}
