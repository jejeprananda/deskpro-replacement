import { NextResponse } from "next/server";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchAgentDirectory } from "@/services/agent-directory.service";
import { agentDirectoryQuerySchema } from "@/types/agent-directory";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = agentDirectoryQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
    });

    const data = await fetchAgentDirectory(query.page);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof DeskproTimeoutError) {
      return NextResponse.json({ message: error.message }, { status: 504 });
    }

    console.error("[GET /api/deskpro/agents]", error);

    return NextResponse.json(
      { message: "Failed to fetch agents" },
      { status: 500 },
    );
  }
}
