import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { submitTicketsMassActions } from "@/services/tickets-mass-actions.service";
import { submitTicketsMassActionsBodySchema } from "@/types/mass-action";

export async function POST(request: Request) {
  try {
    const body = submitTicketsMassActionsBodySchema.parse(await request.json());

    const data = await submitTicketsMassActions({
      ids: body.ids,
      steps: body.steps,
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

    console.error("[POST /api/deskpro/tickets/mass-actions]", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit mass actions";

    return NextResponse.json({ message }, { status: 500 });
  }
}
