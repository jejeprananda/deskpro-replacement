import type { AxiosResponseHeaders, RawAxiosResponseHeaders } from "axios";

export function extractSetCookies(
  headers: AxiosResponseHeaders | RawAxiosResponseHeaders,
): string[] {
  const setCookie =
    headers["set-cookie"] ??
    (headers as Record<string, unknown>)["Set-Cookie"];

  if (!setCookie) {
    return [];
  }

  if (Array.isArray(setCookie)) {
    return setCookie.map(String);
  }

  return [String(setCookie)];
}

export function formatCookieHeader(rawCookies: string[]): string {
  return rawCookies
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter((cookie): cookie is string => Boolean(cookie))
    .join("; ");
}
