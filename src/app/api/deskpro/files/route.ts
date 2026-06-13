import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { fetchAttachmentFile } from "@/services/attachment-file.service";
import { attachmentFileQuerySchema } from "@/types/ticket-detail";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = attachmentFileQuerySchema.parse({
      key: searchParams.get("key") ?? undefined,
      name: searchParams.get("name") ?? undefined,
    });

    const file = await fetchAttachmentFile({
      fileKey: query.key,
      filename: query.name,
    });

    const disposition =
      file.isImage || file.isPdf ? "inline" : "attachment";
    const encodedFilename = encodeURIComponent(file.filename);

    return new NextResponse(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Disposition": `${disposition}; filename="${file.filename}"; filename*=UTF-8''${encodedFilename}`,
        "Cache-Control": "private, max-age=300",
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

    console.error("[GET /api/deskpro/files]", error);

    return NextResponse.json(
      { message: "Failed to fetch attachment file" },
      { status: 500 },
    );
  }
}
