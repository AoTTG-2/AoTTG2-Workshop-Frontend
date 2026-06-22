export type OAuthProvider = "discord" | "google";

export interface ProfileResponse {
  accountId: string;
  email: string;
  displayName: string;
  photonUserId?: string;
  emailVerified: boolean;
  roles: string[];
  permissions?: string[];
  patreon?: {
    linked: boolean;
    patronStatus: string | null;
    tierIds: string[];
    entitledAmountCents: number | null;
    lastSyncedAt: string | null;
  };
}

export interface WorkshopUser {
  authAccountId: string;
  displayName: string;
  creatorName: string | null;
  photonUserId?: string | null;
  roles: string[];
  permissions?: string[];
  lastSeenAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  photonToken?: string;
  accessTokenExpiresAt?: string;
  photonTokenExpiresAt?: string;
  profile: ProfileResponse;
}

export interface ErrorResponse {
  error?: string;
}

export interface OAuthStartResponse {
  authorizationUrl: string;
  state: string;
  error?: string;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  data: T;
  status: number;
}
