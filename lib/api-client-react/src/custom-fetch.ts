export type AuthTokenGetter = () => string | null;

let getToken: AuthTokenGetter = () => null;

export const setAuthTokenGetter = (fn: AuthTokenGetter) => {
  getToken = fn;
};

export const setBaseUrl = (_url: string) => {
  // not needed (safe stub)
};

const API_URL = "https://smartspend-api-ynby.onrender.com";

export const customFetch = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const token = getToken();

  // ✅ ensures correct /api routing
  const cleanUrl = url.startsWith("/api")
    ? url
    : `/api${url}`;

  const response = await fetch(`${API_URL}${cleanUrl}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text);
  }

  return JSON.parse(text);
};