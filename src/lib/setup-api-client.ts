import axios from "axios";
import { notifySessionExpired } from "@/lib/session-expired";

let initialized = false;

export function setupApiClient(): void {
  if (initialized || typeof window === "undefined") {
    return;
  }

  initialized = true;

  axios.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        notifySessionExpired(error.config?.url);
      }

      return Promise.reject(error);
    },
  );
}
