import { notifySessionExpired } from "@/lib/session-expired";

export const BFF_FETCH_OPTIONS: RequestInit = {
  credentials: "include",
};

export async function bffFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, {
    ...BFF_FETCH_OPTIONS,
    ...init,
    headers: {
      ...BFF_FETCH_OPTIONS.headers,
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.pathname
          : input.url;
    notifySessionExpired(url);
  }

  return response;
}
