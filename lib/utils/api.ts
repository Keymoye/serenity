// helper for client-side API requests with consistent error handling

import { logger } from "./logger";

export interface ApiErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  body?: ApiErrorResponse;
}

/**
 * Perform a fetch and parse JSON response. Throws on non-2xx status.
 *
 * @param input URL or Request
 * @param init RequestInit options
 * @returns parsed response body
 */
export async function apiFetch<T = unknown>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, {
    credentials: "same-origin",
    ...init,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    // maybe empty body, ignore
    body = null;
  }

  if (!res.ok) {
    const error = new Error(
      (body as ApiErrorResponse)?.message || (body as ApiErrorResponse)?.error || `Request failed with status ${res.status}`
    ) as ApiError;
    error.status = res.status;
    error.code = (body as ApiErrorResponse)?.code;
    error.body = body as ApiErrorResponse;
    logger.warn("apiFetch error", { status: res.status, code: (body as ApiErrorResponse)?.code, body });
    throw error;
  }

  return body as T;
}

/**
 * Helper for POST requests with JSON body.
 */
export function postJson<T = unknown>(url: string, data: unknown) {
  return apiFetch<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Helper hook for components that need to call APIs with loading/error state.
 */
import { useState, useCallback } from "react";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const call = useCallback(
    async <T = unknown>(fn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setErrorCode(null);
      try {
        const result = await fn();
        setLoading(false);
        return result;
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        logger.error("API call failed", err);
        setError(apiErr.message || "Something went wrong");
        setErrorCode(apiErr.code || null);
        setLoading(false);
        return null;
      }
    },
    []
  );

  return { loading, error, errorCode, call, setError, setErrorCode };
}
