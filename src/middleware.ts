import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";
import { sessionOptions } from "@/lib/session";
import type { UserSession } from "@/types/session";

const protectedRoutes = ["/dashboard", "/tickets", "/profile", "/settings"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<UserSession>(
    request,
    response,
    sessionOptions,
  );

  const isAuthenticated = session.authenticated === true;
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tickets/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
  ],
};
