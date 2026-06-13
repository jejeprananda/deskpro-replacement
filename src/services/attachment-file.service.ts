import axios from "axios";
import { formatCookieHeader } from "@/lib/cookies";
import { getDeskproFileUrl } from "@/lib/deskpro-endpoints";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { destroySession, getSession } from "@/lib/session";
import { isImageAttachment, isPdfAttachment } from "@/types/ticket-detail";

function getRequestTimeout(): number {
  return Number(process.env.DESKPRO_REQUEST_TIMEOUT_MS ?? 30000);
}

export type FetchAttachmentFileParams = {
  fileKey: string;
  filename: string;
};

export type AttachmentFileResult = {
  data: Buffer;
  contentType: string;
  filename: string;
  isImage: boolean;
  isPdf: boolean;
};

export async function fetchAttachmentFile(
  params: FetchAttachmentFileParams,
): Promise<AttachmentFileResult> {
  const session = await getSession();

  if (!session.authenticated || !session.accessToken) {
    throw new UnauthorizedError();
  }

  const url = getDeskproFileUrl(
    params.fileKey,
    params.filename,
    session.accessToken,
  );

  try {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: getRequestTimeout(),
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Cookie: formatCookieHeader(session.deskproCookies),
      },
      validateStatus: () => true,
    });

    if (response.status === 401) {
      await destroySession();
      throw new UnauthorizedError();
    }

    if (response.status !== 200) {
      console.error(
        "[AttachmentFile] HTTP error:",
        response.status,
        params.fileKey,
        params.filename,
      );
      throw new Error("Failed to fetch attachment file");
    }

    const contentType =
      typeof response.headers["content-type"] === "string"
        ? response.headers["content-type"]
        : "application/octet-stream";

    return {
      data: Buffer.from(response.data),
      contentType,
      filename: params.filename,
      isImage: isImageAttachment(contentType, params.filename),
      isPdf: isPdfAttachment(contentType, params.filename),
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new DeskproTimeoutError();
      }
    }

    throw error;
  }
}
