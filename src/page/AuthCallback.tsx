"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Spinner } from "@aottg2/ui";
import { authApi } from "../auth/api";
import { localPath } from "../auth/loginRedirect";
import { useAuth } from "../auth/useAuth";
import { AuthShell } from "./AuthShell";

function restrictedError(data: { code?: string; error?: string; restriction?: { status?: string; reason?: string; expiresAt?: string | null } }) {
  if (data.code !== "account_restricted" || !data.restriction) return data.error ?? "Sign-in failed. Please try again.";
  const label = data.restriction.status === "suspended" ? "SUSPENSION" : "BAN";
  const until = data.restriction.expiresAt ? ` Until: ${new Date(data.restriction.expiresAt).toLocaleString()}.` : "";
  return `REASON FOR ${label}: ${data.restriction.reason || "No reason provided."}${until}`;
}

export function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { acceptSession, refreshProfile } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Sign-in callback is missing a session code.");
      return;
    }

    let active = true;
    authApi.oauthSession(code)
      .then(async ({ ok, data }) => {
        if (!active) return;

        if (!ok || !data.accessToken || !data.refreshToken) {
          setError(restrictedError(data));
          return;
        }

        acceptSession(data);
        await refreshProfile();
        if (active) router.replace(localPath(searchParams.get("next")));
      })
      .catch(() => {
        if (active) setError("Sign-in failed. Please try again.");
      });

    return () => {
      active = false;
    };
  }, [acceptSession, refreshProfile, router, searchParams]);

  if (error) {
    return (
      <AuthShell title="Sign-in failed" subtitle={error}>
        <Button asChild size="lg" className="mt-8 w-full">
          <Link href="/login">Try again</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Signing you in..." subtitle="Completing Workshop sign-in.">
      <Spinner className="mx-auto mt-8" label="Signing in" />
    </AuthShell>
  );
}
