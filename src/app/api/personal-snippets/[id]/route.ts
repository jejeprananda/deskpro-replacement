import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/errors";
import { getSession } from "@/lib/session";
import {
  deletePersonalSnippet,
  updatePersonalSnippet,
} from "@/services/personal-snippet.service";
import {
  personalSnippetParamsSchema,
  updatePersonalSnippetSchema,
} from "@/types/personal-snippet";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireAgentId(): Promise<string> {
  const session = await getSession();

  if (!session.authenticated || !session.agentId) {
    throw new UnauthorizedError();
  }

  return session.agentId;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const agentId = await requireAgentId();
    const { id } = personalSnippetParamsSchema.parse(await context.params);
    const body = updatePersonalSnippetSchema.parse(await request.json());
    const snippet = updatePersonalSnippet(agentId, id, body);

    if (!snippet) {
      return NextResponse.json({ message: "Snippet not found" }, { status: 404 });
    }

    return NextResponse.json(snippet);
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

    console.error("[PUT /api/personal-snippets/[id]]", error);

    return NextResponse.json(
      { message: "Failed to update personal snippet" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const agentId = await requireAgentId();
    const { id } = personalSnippetParamsSchema.parse(await context.params);
    const deleted = deletePersonalSnippet(agentId, id);

    if (!deleted) {
      return NextResponse.json({ message: "Snippet not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
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

    console.error("[DELETE /api/personal-snippets/[id]]", error);

    return NextResponse.json(
      { message: "Failed to delete personal snippet" },
      { status: 500 },
    );
  }
}
