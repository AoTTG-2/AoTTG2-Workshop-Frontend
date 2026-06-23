"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@aottg2/ui";
import { localPath, websiteLoginUrl } from "../../auth/loginRedirect";
import { useAuth } from "../../auth/useAuth";
import { AuthShell } from "../AuthShell";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const next = useMemo(() => localPath(searchParams.get("next")), [searchParams]);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace(next);
      return;
    }

    window.location.href = websiteLoginUrl(next);
  }, [isAuthenticated, isLoading, next, router]);

  return (
    <AuthShell title="Opening AoTTG2 sign-in..." subtitle="Returning you to Workshop after sign-in.">
      <Spinner className="mx-auto mt-8" label="Opening sign-in" />
    </AuthShell>
  );
}
