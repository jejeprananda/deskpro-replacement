import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  fetchTicketList,
  InvalidTicketBucketError,
} from "@/services/ticket-list.service";
import { ticketListQuerySchema } from "@/types/ticket-list";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = ticketListQuerySchema.parse({
      filterId: searchParams.get("filterId") ?? undefined,
      bucket: searchParams.get("bucket") ?? undefined,
      scope: searchParams.get("scope") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      waitingSort: searchParams.get("waitingSort") ?? undefined,
    });

    const data = await fetchTicketList(query);
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

    console.error("[GET /api/deskpro/tickets]", error);

    return NextResponse.json(
      { message: "Failed to fetch ticket list" },
      { status: 500 },
    );
  }
}
