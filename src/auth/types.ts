export interface ProfileResponse {
  accountId: string;
  email: string;
  displayName: string;
  description?: string | null;
  avatarKey?: string | null;
  bannerKey?: string | null;
  socials?: Record<string, string>;
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

export interface ProfilePreset {
  key: string;
  label: string;
  imageUrl: string;
}

export interface ProfilePresetCatalog {
  avatars: ProfilePreset[];
  banners: ProfilePreset[];
}

export interface ErrorResponse {
  error?: string;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  data: T;
  status: number;
}
