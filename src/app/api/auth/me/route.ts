import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type { AuthMeResponse } from "@/types/auth";

export async function GET() {
  try {
    const session = await getSession();

    const payload: AuthMeResponse = {
      authenticated: session.authenticated,
      user: session.authenticated
        ? {
            id: session.user.id,
            name: session.user.name,
            displayName: session.user.displayName,
            email: session.user.email,
            avatar: session.user.avatar,
            timezone: session.user.timezone,
          }
        : null,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[GET /api/auth/me]", error);

    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 },
    );
  }
}
