"use client";

/**
 * fetch() wrapper for client components. On a 401 response it tries a
 * silent refresh (POST /api/auth/refresh) once and retries the original
 * request before giving up.
 */
export async function apiFetch(url: string, init: RequestInit = {}, _retried = false): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });

  if (response.status === 401 && !_retried) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
    if (refreshed.ok) {
      return apiFetch(url, init, true);
    }
  }

  return response;
}

export async function apiJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(url, init);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (data && (data.error as string)) || `Request failed with ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}
