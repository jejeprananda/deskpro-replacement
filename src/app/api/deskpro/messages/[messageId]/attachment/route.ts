import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchAttachmentContent } from "@/services/attachment-download-url.service";
import {
  attachmentContentQuerySchema,
  messageAttachmentParamsSchema,
} from "@/types/ticket-detail";

type RouteContext = {
  params: Promise<{ messageId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { messageId } = messageAttachmentParamsSchema.parse(
      await context.params,
    );
    const { searchParams } = new URL(request.url);
    const query = attachmentContentQuerySchema.parse({
      filename: searchParams.get("filename") ?? undefined,
      disposition: searchParams.get("disposition") ?? undefined,
    });

    const file = await fetchAttachmentContent({
      messageId,
      filename: query.filename,
    });

    const encodedFilename = encodeURIComponent(file.filename);

    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `${query.disposition}; filename="${file.filename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "private, max-age=60",
      },
    });
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

    console.error("[GET /api/deskpro/messages/[messageId]/attachment]", error);

    return NextResponse.json(
      { message: "Failed to fetch attachment" },
      { status: 500 },
    );
  }
}
