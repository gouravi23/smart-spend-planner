export const customFetch = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://smartspend-api-ynby.onrender.com";

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};