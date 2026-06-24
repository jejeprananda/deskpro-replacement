import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedError } from "@/lib/errors";
import { getSession } from "@/lib/session";
import { listTicketReplyLogs } from "@/services/ticket-reply-log.service";

const ticketIdParamsSchema = z.object({
  ticketId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session.authenticated || !session.agentId) {
      throw new UnauthorizedError();
    }

    const { ticketId } = ticketIdParamsSchema.parse(await context.params);
    const logs = await listTicketReplyLogs(ticketId);

    return NextResponse.json({
      ticketId,
      logs,
      totalCount: logs.length,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request", errors: error.flatten() },
        { status: 400 },
      );
    }

    console.error("[GET /api/ticket-replies/[ticketId]]", error);

    return NextResponse.json(
      { message: "Failed to fetch ticket reply logs" },
      { status: 500 },
    );
  }
}
