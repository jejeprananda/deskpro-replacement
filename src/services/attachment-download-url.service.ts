import axios, { type AxiosResponse } from "axios";
import JSZip from "jszip";
import { z } from "zod";
import { formatCookieHeader } from "@/lib/cookies";
import { getDeskproAttachmentDownloadUrlGraphqlPath } from "@/lib/deskpro-endpoints";
import { DeskproClient } from "@/lib/deskpro-client";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { getSession } from "@/lib/session";
import { isImageAttachment, isPdfAttachment } from "@/types/ticket-detail";
import type { UserSession } from "@/types/session";

const TICKET_MESSAGE_ATTACHMENTS_DOWNLOAD_URL_HASH =
  "0e9065ce4cdbd66906c3d802a2eb26db84ff22157dd0c1545fe7e784979050c3";

const attachmentDownloadUrlResponseSchema = z.object({
  data: z.object({
    ticketMessageAttachmentsDownloadUrl: z.object({
      url: z.string(),
      expires: z.string(),
    }),
  }),
});

export type AttachmentDownloadUrlResult = {
  url: string;
  expires: string;
};

export type FetchAttachmentContentParams = {
  messageId: string;
  filename: string;
};

export type AttachmentContentResult = {
  data: Buffer;
  contentType: string;
  filename: string;
};

function getRequestTimeout(): number {
  return Number(process.env.DESKPRO_REQUEST_TIMEOUT_MS ?? 30000);
}

function buildDownloadUrlPayload(messageId: string) {
  return {
    operationName: "TicketMessageAttachmentsDownloadUrl",
    variables: {
      id: messageId,
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: TICKET_MESSAGE_ATTACHMENTS_DOWNLOAD_URL_HASH,
      },
    },
  };
}

function isZipContentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase();
  return (
    normalized.includes("application/zip") ||
    normalized.includes("application/x-zip-compressed")
  );
}

function isZipBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }

  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  );
}

function shouldExtractZip(contentType: string, buffer: Buffer): boolean {
  return isZipContentType(contentType) || isZipBuffer(buffer);
}

function findZipEntryName(
  zip: JSZip,
  filename: string,
): string | null {
  const lowerFilename = filename.toLowerCase();
  const entries = Object.keys(zip.files).filter(
    (name) => !zip.files[name]?.dir,
  );

  if (entries.length === 0) {
    return null;
  }

  const exactMatch = entries.find(
    (name) => name.toLowerCase() === lowerFilename,
  );
  if (exactMatch) {
    return exactMatch;
  }

  const basenameMatch = entries.find((name) => {
    const parts = name.split("/");
    return parts[parts.length - 1]?.toLowerCase() === lowerFilename;
  });
  if (basenameMatch) {
    return basenameMatch;
  }

  const suffixMatch = entries.find((name) =>
    name.toLowerCase().endsWith(lowerFilename),
  );
  if (suffixMatch) {
    return suffixMatch;
  }

  if (entries.length === 1) {
    return entries[0] ?? null;
  }

  return null;
}

function guessContentType(filename: string): string {
  const lower = filename.toLowerCase();

  if (isImageAttachment("", filename)) {
    if (lower.endsWith(".png")) {
      return "image/png";
    }
    if (lower.endsWith(".gif")) {
      return "image/gif";
    }
    if (lower.endsWith(".webp")) {
      return "image/webp";
    }
    if (lower.endsWith(".svg")) {
      return "image/svg+xml";
    }
    return "image/jpeg";
  }

  if (isPdfAttachment("", filename)) {
    return "application/pdf";
  }

  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (lower.endsWith(".doc")) {
    return "application/msword";
  }

  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }

  if (lower.endsWith(".xls")) {
    return "application/vnd.ms-excel";
  }

  if (lower.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }

  if (lower.endsWith(".ppt")) {
    return "application/vnd.ms-powerpoint";
  }

  return "application/octet-stream";
}

async function extractFileFromZip(
  zipBuffer: Buffer,
  filename: string,
): Promise<AttachmentContentResult> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const entryName = findZipEntryName(zip, filename);

  if (!entryName) {
    throw new Error(`Attachment not found in archive: ${filename}`);
  }

  const entry = zip.files[entryName];
  if (!entry) {
    throw new Error(`Attachment not found in archive: ${filename}`);
  }

  const data = Buffer.from(await entry.async("arraybuffer"));

  return {
    data,
    contentType: guessContentType(filename),
    filename,
  };
}

export async function fetchAttachmentDownloadUrl(
  messageId: string,
): Promise<AttachmentDownloadUrlResult> {
  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      getDeskproAttachmentDownloadUrlGraphqlPath(),
      buildDownloadUrlPayload(messageId),
    );

    const parsed = attachmentDownloadUrlResponseSchema.parse(data);

    return parsed.data.ticketMessageAttachmentsDownloadUrl;
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      console.error(
        "[AttachmentDownloadUrl] HTTP error:",
        error.response?.status,
        error.response?.data,
      );
      throw new Error("Failed to fetch attachment download URL");
    }

    throw error;
  }
}

async function fetchSignedUrlContent(
  url: string,
  session: UserSession,
): Promise<AxiosResponse<ArrayBuffer>> {
  const requestConfig = {
    responseType: "arraybuffer" as const,
    timeout: getRequestTimeout(),
    validateStatus: () => true,
  };

  let response = await axios.get<ArrayBuffer>(url, requestConfig);

  if (response.status === 200) {
    return response;
  }

  response = await axios.get<ArrayBuffer>(url, {
    ...requestConfig,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Cookie: formatCookieHeader(session.deskproCookies),
    },
  });

  return response;
}

export async function fetchAttachmentContent(
  params: FetchAttachmentContentParams,
): Promise<AttachmentContentResult> {
  const session = await getSession();

  if (!session.authenticated || !session.accessToken) {
    throw new UnauthorizedError();
  }

  const { url } = await fetchAttachmentDownloadUrl(params.messageId);

  try {
    const response = await fetchSignedUrlContent(url, session);

    if (response.status !== 200) {
      console.error(
        "[AttachmentContent] HTTP error:",
        response.status,
        params.messageId,
        params.filename,
      );
      throw new Error("Failed to fetch attachment content");
    }

    const contentType =
      typeof response.headers["content-type"] === "string"
        ? response.headers["content-type"].split(";")[0]?.trim() ??
          "application/octet-stream"
        : "application/octet-stream";

    const buffer = Buffer.from(response.data);

    if (shouldExtractZip(contentType, buffer)) {
      return extractFileFromZip(buffer, params.filename);
    }

    return {
      data: buffer,
      contentType: contentType.startsWith("application/octet-stream")
        ? guessContentType(params.filename)
        : contentType,
      filename: params.filename,
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
