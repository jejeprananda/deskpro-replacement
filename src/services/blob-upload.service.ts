import axios from "axios";
import { z } from "zod";
import { formatCookieHeader } from "@/lib/cookies";
import { DeskproClient } from "@/lib/deskpro-client";
import { getDeskproGenerateBlobUploadRequestPath } from "@/lib/deskpro-endpoints";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { getSession } from "@/lib/session";

const GENERATE_BLOB_UPLOAD_REQUEST_HASH =
  "17d2d099d370089ea7bc41c89718fa6a7b72600e76158320d7391272b4efa5b2";

const generateBlobUploadRequestResponseSchema = z.object({
  data: z.object({
    generateBlobUploadRequest: z.object({
      id: z.union([z.string(), z.number()]),
      token: z.string(),
      upload_url: z.string(),
    }),
  }),
});

const blobUploadResponseSchema = z.object({
  download_url: z.string(),
});

export type BlobUploadResult = {
  uploadRequestId: string;
  downloadUrl: string;
  filename: string;
};

function getRequestTimeout(): number {
  return Number(process.env.DESKPRO_REQUEST_TIMEOUT_MS ?? 30000);
}

async function generateBlobUploadRequest(): Promise<{
  id: string;
  token: string;
  uploadUrl: string;
}> {
  const client = await DeskproClient.fromSession();
  const data = await client.post<unknown>(
    getDeskproGenerateBlobUploadRequestPath(),
    {
      operationName: "GenerateBlobUploadRequest",
      variables: {},
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: GENERATE_BLOB_UPLOAD_REQUEST_HASH,
        },
      },
    },
  );

  const parsed = generateBlobUploadRequestResponseSchema.parse(data);
  const request = parsed.data.generateBlobUploadRequest;

  return {
    id: String(request.id),
    token: request.token,
    uploadUrl: request.upload_url,
  };
}

export async function uploadBlobFile(params: {
  file: Buffer;
  filename: string;
  contentType: string;
}): Promise<BlobUploadResult> {
  const session = await getSession();

  if (!session.authenticated || !session.accessToken) {
    throw new UnauthorizedError();
  }

  const uploadRequest = await generateBlobUploadRequest();
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(params.file)], {
    type: params.contentType || "application/octet-stream",
  });
  formData.append("id", uploadRequest.id);
  formData.append("token", uploadRequest.token);
  formData.append("file", blob, params.filename);

  try {
    const response = await axios.post(
      uploadRequest.uploadUrl,
      formData,
      {
        timeout: getRequestTimeout(),
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Cookie: formatCookieHeader(session.deskproCookies),
          "X-Requested-With": "XMLHttpRequest",
        },
        validateStatus: () => true,
      },
    );

    if (response.status < 200 || response.status >= 300) {
      console.error(
        "[BlobUpload] HTTP error:",
        response.status,
        response.data,
      );
      throw new Error(
        `Blob upload failed (HTTP ${response.status}): ${JSON.stringify(response.data)}`,
      );
    }

    const parsed = blobUploadResponseSchema.parse(response.data);

    return {
      uploadRequestId: uploadRequest.id,
      downloadUrl: parsed.download_url,
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
