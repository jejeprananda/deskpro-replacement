import { NextResponse } from "next/server";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchAgentTeams } from "@/services/agent-teams.service";

export async function GET() {
  try {
    const data = await fetchAgentTeams();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof DeskproTimeoutError) {
      return NextResponse.json({ message: error.message }, { status: 504 });
    }

    console.error("[GET /api/deskpro/agent-teams]", error);

    return NextResponse.json(
      { message: "Failed to fetch agent teams" },
      { status: 500 },
    );
  }
}
