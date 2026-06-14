import { NextResponse } from "next/server";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { uploadBlobFile } from "@/services/blob-upload.service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBlobFile({
      file: buffer,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof DeskproTimeoutError) {
      return NextResponse.json({ message: error.message }, { status: 504 });
    }

    console.error("[POST /api/deskpro/blobs/upload]", error);

    const message =
      error instanceof Error ? error.message : "Failed to upload file";

    return NextResponse.json({ message }, { status: 500 });
  }
}
