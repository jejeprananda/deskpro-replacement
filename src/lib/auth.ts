import { redirect } from "next/navigation";
import { login as deskproLogin } from "@/services/auth.service";
import { loadAuth } from "@/services/load-auth.service";
import { destroySession, getSession } from "@/lib/session";
import type { LoginRequest } from "@/types/auth";
import { mapDeskproUserToUser } from "@/types/user";

export { getSession } from "@/lib/session";

export async function login(payload: LoginRequest): Promise<void> {
  const credentials = await deskproLogin(payload);
  const authResult = await loadAuth(
    credentials.deskproCookies,
    credentials.accessToken,
  );

  const session = await getSession();

  session.authenticated = true;
  session.accessToken = credentials.accessToken;
  session.expiresIn = credentials.expiresIn;
  session.idleTimeout = credentials.idleTimeout;
  session.deskproCookies = credentials.deskproCookies;
  session.agentId = authResult.agentId;
  session.agentTeamId = authResult.agentTeamId;
  session.user = mapDeskproUserToUser(authResult.user);

  await session.save();
}

export async function logout(): Promise<void> {
  await destroySession();
}

export async function requireAuth() {
  const session = await getSession();

  if (!session.authenticated) {
    redirect("/login");
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();
  return session.authenticated ? session.user : null;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.authenticated === true;
}
