import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { login } from "@/lib/auth";
import { loginRequestSchema } from "@/types/auth";
import { AuthError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = loginRequestSchema.parse(body);

    await login(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request", errors: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[POST /api/auth/login]", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
