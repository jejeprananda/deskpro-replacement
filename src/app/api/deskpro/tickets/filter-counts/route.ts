import { NextResponse } from "next/server";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchTicketFilterCounts } from "@/services/ticket-filter-count.service";

export async function GET() {
  try {
    const data = await fetchTicketFilterCounts();
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
