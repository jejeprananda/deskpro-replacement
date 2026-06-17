import { useSessionExpiredStore } from "@/stores/session-expired.store";

const AUTH_EXCLUDED_PATHS = ["/api/auth/login", "/api/auth/logout"];

function normalizeRequestPath(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  return url.split("?")[0] ?? url;
}

export function shouldTriggerSessionExpired(url?: string): boolean {
  if (!url) {
    return false;
  }

  const path = normalizeRequestPath(url);

  if (!path.startsWith("/api/")) {
    return false;
  }

  return !AUTH_EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded));
}

export function notifySessionExpired(url?: string): void {
  if (!shouldTriggerSessionExpired(url)) {
    return;
  }

  useSessionExpiredStore.getState().openSessionExpired();
}
