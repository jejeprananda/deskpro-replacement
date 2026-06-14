import { NextResponse } from "next/server";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchTopLevelSnippets } from "@/services/top-level-snippets.service";

export async function GET() {
  try {
    const data = await fetchTopLevelSnippets();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof DeskproTimeoutError) {
      return NextResponse.json({ message: error.message }, { status: 504 });
    }

    console.error("[GET /api/deskpro/snippets]", error);

    return NextResponse.json(
      { message: "Failed to fetch snippets" },
      { status: 500 },
    );
  }
}
