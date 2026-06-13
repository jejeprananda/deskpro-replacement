import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { UserSession } from "@/types/session";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long");
  }

  return secret;
}

export const defaultSession: UserSession = {
  authenticated: false,
  accessToken: "",
  expiresIn: 0,
  idleTimeout: 0,
  agentId: "",
  agentTeamId: "",
  user: {
    id: "",
    name: "",
    displayName: "",
    email: "",
  },
  deskproCookies: [],
};

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: "deskpro_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<UserSession>(await cookies(), sessionOptions);
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
