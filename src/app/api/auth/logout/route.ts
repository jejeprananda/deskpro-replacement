import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  try {
    await logout();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
