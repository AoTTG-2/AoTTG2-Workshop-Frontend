import type { ProfileResponse, WorkshopUser } from "./types";

export interface AuthContextValue {
  profile: ProfileResponse | null;
  workshopUser: WorkshopUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  acceptSession: (auth: { accessToken: string; refreshToken: string; profile: ProfileResponse }) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

import { createContext } from "react";

export const AuthContext = createContext<AuthContextValue | null>(null);
