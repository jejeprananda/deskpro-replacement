import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  fetchTicketStatusSummary,
} from "@/services/ticket-status-summary.service";
import { InvalidTicketBucketError } from "@/services/ticket-list.service";
import { ticketStatusSummaryQuerySchema } from "@/types/ticket-status-summary";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = ticketStatusSummaryQuerySchema.parse({
      filterId: searchParams.get("filterId") ?? undefined,
      bucket: searchParams.get("bucket") ?? undefined,
    });

    const data = await fetchTicketStatusSummary(query);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: "Invalid request", errors: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof InvalidTicketBucketError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof DeskproTimeoutError) {
      return NextResponse.json({ message: error.message }, { status: 504 });
    }

    console.error("[GET /api/deskpro/tickets/status-summary]", error);

    return NextResponse.json(
      { message: "Failed to fetch ticket status summary" },
      { status: 500 },
    );
  }
}
