"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { createDevToken } from "@/lib/auth/dev-token";
import { onboardUser } from "@/lib/services";
import { ApiError } from "@/lib/api/client";
import { GlassPanel } from "@/components/shared/glass-panel";
import { MagneticButton } from "@/components/shared/magnetic-button";

/**
 * Dev-mode auth gate. The real backend expects a Clerk JWT; until Clerk is
 * wired up, this collects an email/name, mints a locally-generated token
 * (lib/auth/dev-token.ts) the backend's dev fallback accepts, and calls
 * the real onboarding endpoint so a User row actually exists server-side.
 */
export function SignInGate({ children }: { children: React.ReactNode }) {
  const { user, token, setSession } = useAuthStore();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user && token) return <>{children}</>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const devToken = createDevToken();
      useAuthStore.setState({ token: devToken });
      const profile = await onboardUser(email, name);
      setSession(devToken, profile);
    } catch (err) {
      useAuthStore.setState({ token: null });
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the backend. Is it running on NEXT_PUBLIC_API_URL?"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <GlassPanel strong className="w-full max-w-sm p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-highlight/40">
          Dev sign-in
        </p>
        <h1 className="font-display mt-2 text-2xl">Enter the workspace</h1>
        <p className="mt-2 text-sm text-highlight/50">
          No Clerk account wired up yet — this creates a real user record on
          the backend using a locally generated token.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            required
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm placeholder:text-highlight/30 focus:border-accent-teal/40 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm placeholder:text-highlight/30 focus:border-accent-teal/40 focus:outline-none"
          />
          {error && <p className="text-xs text-warning">{error}</p>}
          <MagneticButton type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Connecting…" : "Continue"}
          </MagneticButton>
        </form>
      </GlassPanel>
    </div>
  );
}
