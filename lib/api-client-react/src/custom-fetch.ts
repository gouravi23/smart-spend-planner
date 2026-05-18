export type AuthTokenGetter = () => string | null;

let getToken: AuthTokenGetter = () => null;

export const setAuthTokenGetter = (fn: AuthTokenGetter) => {
  getToken = fn;
};

export const setBaseUrl = (_url: string) => {
  // not needed
};

const API_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any)?.env?.VITE_API_URL) ||
  "https://smartspend-api-ynby.onrender.com";

export const customFetch = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const token = getToken();

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