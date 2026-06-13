import axios, { type AxiosInstance } from "axios";
import { formatCookieHeader } from "@/lib/cookies";
import { getDeskproBaseUrl } from "@/lib/deskpro-endpoints";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { destroySession, getSession } from "@/lib/session";

function getRequestTimeout(): number {
  return Number(process.env.DESKPRO_REQUEST_TIMEOUT_MS ?? 30000);
}

export function createDeskproAxios(
  deskproCookies: string[],
  accessToken: string,
): AxiosInstance {
  const instance = axios.create({
    baseURL: getDeskproBaseUrl(),
    timeout: getRequestTimeout(),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Cookie: formatCookieHeader(deskproCookies),
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "deskpro-last-mut": "-1",
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new DeskproTimeoutError();
        }

        if (error.response?.status === 401) {
          await destroySession();
          throw new UnauthorizedError();
        }
      }

      throw error;
    },
  );

  return instance;
}

export class DeskproClient {
  private constructor(private readonly client: AxiosInstance) {}

  static async fromSession(): Promise<DeskproClient> {
    const session = await getSession();

    if (!session.authenticated || !session.accessToken) {
      throw new UnauthorizedError();
    }

    const client = createDeskproAxios(session.deskproCookies, session.accessToken);
    return new DeskproClient(client);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.client.post<T>(path, body);
    return response.data;
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.client.get<T>(path);
    return response.data;
  }
}
