import { useAuthStore } from "@/lib/store/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Most calls are quick DB reads/writes. Pipeline runs (generate/*) are
// genuinely slow on local models (multiple sequential LLM calls can take
// several minutes) and pass a longer override explicitly.
const DEFAULT_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options;
  const token = useAuthStore.getState().token;
  const isFormData = init.body instanceof FormData;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        0,
        `Request timed out after ${Math.round(timeoutMs / 1000)}s — the backend may be down or unresponsive.`
      );
    }
    throw new ApiError(0, "Could not reach the backend. Is it running?");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") message = data.detail;
    } catch {
      // response body wasn't JSON — keep the statusText fallback
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, {
      ...opts,
      method: "POST",
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body: JSON.stringify(body) }),
};
