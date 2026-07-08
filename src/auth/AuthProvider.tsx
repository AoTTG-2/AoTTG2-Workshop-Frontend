import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getWorkshopMe } from "../lib/api/workshop";
import { authApi } from "./api";
import { AuthContext } from "./AuthContext";
import { clearTokens, getAccessToken, getRefreshToken, hasTokens, setTokens } from "./storage";
import type { AuthResponse, ProfileResponse, WorkshopUser } from "./types";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [workshopUser, setWorkshopUser] = useState<WorkshopUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncWorkshopUser = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setWorkshopUser(null);
      return false;
    }

    const workshopMe = await getWorkshopMe(accessToken);
    if (!workshopMe) {
      setWorkshopUser(null);
      return false;
    }

    setWorkshopUser(workshopMe);
    return true;
  }, []);

  const hydrateSession = useCallback(async () => {
    if (!hasTokens()) {
      setProfile(null);
      setWorkshopUser(null);
      return;
    }

    const { ok, data, status } = await authApi.getProfile();
    if (!ok && status === 401) {
      clearTokens();
      setProfile(null);
      setWorkshopUser(null);
      return;
    }

    if (!ok) {
      setProfile(null);
      setWorkshopUser(null);
      return;
    }

    setProfile(data);

    try {
      await syncWorkshopUser();
    } catch {
      // Workshop profile sync should not invalidate a valid auth-service session.
      setWorkshopUser(null);
    }
  }, [syncWorkshopUser]);

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    if (!hasTokens()) {
      setProfile(null);
      setWorkshopUser(null);
      setIsLoading(false);
      return;
    }

    try {
      await hydrateSession();
    } finally {
      setIsLoading(false);
    }
  }, [hydrateSession]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!hasTokens()) {
        if (active) {
          setProfile(null);
          setWorkshopUser(null);
          setIsLoading(false);
        }
        return;
      }

      if (active) setIsLoading(true);
      await hydrateSession();

      if (active) {
        setIsLoading(false);
      }
    }

    loadProfile().catch(() => {
      if (active) {
        setProfile(null);
        setWorkshopUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [hydrateSession]);

  const acceptSession = useCallback((auth: AuthResponse) => {
    setIsLoading(true);
    setTokens(auth.accessToken, auth.refreshToken);
    setProfile(auth.profile);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // network failures must still clear local state
      }
    }

    clearTokens();
    setProfile(null);
    setWorkshopUser(null);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      workshopUser,
      isAuthenticated: profile !== null,
      isLoading,
      acceptSession,
      logout,
      refreshProfile,
    }),
    [profile, workshopUser, isLoading, acceptSession, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
