import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/lib/errors";
import { getSession } from "@/lib/session";
import {
  createPersonalSnippet,
  listPersonalSnippets,
} from "@/services/personal-snippet.service";
import { createPersonalSnippetSchema } from "@/types/personal-snippet";

async function requireAgentId(): Promise<string> {
  const session = await getSession();

  if (!session.authenticated || !session.agentId) {
    throw new UnauthorizedError();
  }

  return session.agentId;
}

export async function GET() {
  try {
    const agentId = await requireAgentId();
    const snippets = listPersonalSnippets(agentId);

    return NextResponse.json({
      snippets,
      totalCount: snippets.length,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    console.error("[GET /api/personal-snippets]", error);

    return NextResponse.json(
      { message: "Failed to fetch personal snippets" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const agentId = await requireAgentId();
    const body = createPersonalSnippetSchema.parse(await request.json());
    const snippet = createPersonalSnippet(agentId, body);

    return NextResponse.json(snippet, { status: 201 });
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

    console.error("[POST /api/personal-snippets]", error);

    return NextResponse.json(
      { message: "Failed to create personal snippet" },
      { status: 500 },
    );
  }
}
