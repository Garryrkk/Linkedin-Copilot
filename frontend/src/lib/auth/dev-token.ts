/**
 * DEV-ONLY auth. The backend verifies real Clerk JWTs against Clerk's API,
 * but falls back to an unverified JWT decode when that fails
 * (see Backend/api/middleware/auth.py: get_clerk_user_id). This generates
 * a JWT-shaped token with a stable `sub` claim so that fallback succeeds
 * locally, with no Clerk account required.
 *
 * To swap in real Clerk later: replace `getDevToken()`'s call site in
 * lib/store/auth-store.ts with Clerk's `useAuth().getToken()` — everything
 * downstream (lib/api/client.ts) only cares that *some* bearer token exists.
 */

const SUBJECT_STORAGE_KEY = "audience-ai-dev-subject";

function base64url(input: string): string {
  const base64 = btoa(input);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getOrCreateSubject(): string {
  if (typeof window === "undefined") return "dev_ssr";
  let subject = localStorage.getItem(SUBJECT_STORAGE_KEY);
  if (!subject) {
    subject = `dev_${crypto.randomUUID()}`;
    localStorage.setItem(SUBJECT_STORAGE_KEY, subject);
  }
  return subject;
}

export function createDevToken(): string {
  const subject = getOrCreateSubject();
  const header = base64url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({ sub: subject, iat: Math.floor(Date.now() / 1000) })
  );
  return `${header}.${payload}.dev`;
}
