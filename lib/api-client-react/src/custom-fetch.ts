export type AuthTokenGetter = () => string | null;

let getToken: AuthTokenGetter = () => null;

export const setAuthTokenGetter = (fn: AuthTokenGetter) => {
  getToken = fn;
};

export const setBaseUrl = (url: string) => {
  // optional if used, otherwise safe stub
};

export const customFetch = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
 const API_URL = "https://smartspend-api-ynby.onrender.com";

  const token = getToken();

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
};