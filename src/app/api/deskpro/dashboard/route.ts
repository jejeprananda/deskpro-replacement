import { NextResponse } from "next/server";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchDashboard } from "@/services/dashboard.service";

export async function GET() {
  try {
    const data = await fetchDashboard();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof DeskproTimeoutError) {
      return NextResponse.json({ message: error.message }, { status: 504 });
    }

    console.error("[GET /api/deskpro/dashboard]", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch dashboard data";

    return NextResponse.json({ message }, { status: 500 });
  }
}
