import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchTicketSearch } from "@/services/ticket-search.service";
import { ticketSearchQuerySchema } from "@/types/ticket-search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = ticketSearchQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      perPage: searchParams.get("perPage") ?? undefined,
    });

    const data = await fetchTicketSearch(query);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid request", errors: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof DeskproTimeoutError) {
      return NextResponse.json({ message: error.message }, { status: 504 });
    }

    console.error("[GET /api/deskpro/tickets/search]", error);

    return NextResponse.json(
      { message: "Failed to search tickets" },
      { status: 500 },
    );
  }
}
