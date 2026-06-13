import axios from "axios";
import {
  deskproLoginResponseSchema,
  type DeskproLoginResult,
  type LoginRequest,
} from "@/types/auth";
import { extractSetCookies } from "@/lib/cookies";
import { getDeskproLoginUrl } from "@/lib/deskpro-endpoints";
import { AuthError } from "@/lib/errors";

function getRequestTimeout(): number {
  return Number(process.env.DESKPRO_REQUEST_TIMEOUT_MS ?? 30000);
}

export async function login(
  payload: LoginRequest,
): Promise<DeskproLoginResult> {
  try {
    const response = await axios.post(getDeskproLoginUrl(), payload,
      {
        timeout: getRequestTimeout(),
      },
    );

    const parsed = deskproLoginResponseSchema.parse(response.data);
    const deskproCookies = extractSetCookies(response.headers);

    return {
      accessToken: parsed.access_token,
      expiresIn: parsed.expires_in,
      idleTimeout: parsed.idle_timeout,
      deskproCookies,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 401;
      const message =
        (error.response?.data as { message?: string } | undefined)?.message ??
        "Login failed";

      throw new AuthError(message, status);
    }

    throw error;
  }
}
