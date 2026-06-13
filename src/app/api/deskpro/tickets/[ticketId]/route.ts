import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchTicketDetail } from "@/services/ticket-detail.service";
import { ticketDetailQuerySchema } from "@/types/ticket-detail";

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { ticketId } = await context.params;
    const { searchParams } = new URL(request.url);
    const query = ticketDetailQuerySchema.parse({
      ownerId: searchParams.get("ownerId") ?? undefined,
    });

    const data = await fetchTicketDetail({
      ticketId,
      ownerId: query.ownerId,
    });

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

    console.error("[GET /api/deskpro/tickets/[ticketId]]", error);

    return NextResponse.json(
      { message: "Failed to fetch ticket detail" },
      { status: 500 },
    );
  }
}
