import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { submitTicketReply } from "@/services/ticket-reply.service";
import { submitTicketReplyBodySchema } from "@/types/ticket-reply";
import { z } from "zod";

const ticketIdParamsSchema = z.object({
  ticketId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { ticketId } = ticketIdParamsSchema.parse(await context.params);
    const body = submitTicketReplyBodySchema.parse(await request.json());

    const data = await submitTicketReply({
      ticketId,
      message: body.message,
      statusId: body.statusId,
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

    console.error("[POST /api/deskpro/tickets/[ticketId]/reply]", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit ticket reply";

    return NextResponse.json({ message }, { status: 500 });
  }
}
