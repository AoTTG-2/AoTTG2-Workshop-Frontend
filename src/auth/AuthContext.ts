import type { ProfileResponse, WorkshopUser } from "./types";

export interface AuthContextValue {
  profile: ProfileResponse | null;
  workshopUser: WorkshopUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  acceptSession: (auth: { accessToken: string; refreshToken: string; profile: ProfileResponse }) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

import { createContext } from "react";

export const AuthContext = createContext<AuthContextValue | null>(null);
