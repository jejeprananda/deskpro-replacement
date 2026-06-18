import { NextResponse } from "next/server";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchTicketFilterCounts } from "@/services/ticket-filter-count.service";
import { ticketScopeSchema } from "@/types/ticket-list";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeParam = searchParams.get("scope");
    const scope =
      scopeParam === "mine"
        ? ticketScopeSchema.parse("mine")
        : ticketScopeSchema.parse("all");

    const data = await fetchTicketFilterCounts({ scope });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof DeskproTimeoutError) {
      return NextResponse.json({ message: error.message }, { status: 504 });
    }

    console.error("[GET /api/deskpro/tickets/filter-counts]", error);

    return NextResponse.json(
      { message: "Failed to fetch ticket filter counts" },
      { status: 500 },
    );
  }
}
