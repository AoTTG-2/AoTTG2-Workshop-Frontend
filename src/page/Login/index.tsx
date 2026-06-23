"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../auth/useAuth";
import { Button, Input, Label } from "@aottg2/ui";
import { AuthShell, ErrorMessage } from "../AuthShell";
import { OAuthButtons, OAuthDivider } from "../OAuthButtons";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(searchParams.get("error") ?? "");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.ok) {
        router.push("/");
      } else {
        setError(result.error ?? "Login failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Sign in to your AoTTG2 account.">
      <OAuthButtons disabled={isSubmitting || isLoading} onError={setError} />
      <OAuthDivider />

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            className="h-10 text-sm"
            type="email"
            autoComplete="email"
            placeholder="mikasa.ackerman@scouts.example"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            className="h-10 text-sm"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || isLoading}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm font-medium text-muted-foreground">
        <span>
          No account?{" "}
          <Button asChild variant="link" className="h-auto p-0 text-foreground normal-case tracking-normal">
            <Link href="/register">Register</Link>
          </Button>
        </span>
        <Button asChild variant="link" className="h-auto p-0 text-foreground normal-case tracking-normal">
          <Link href="/forgot-password">Forgot password?</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
