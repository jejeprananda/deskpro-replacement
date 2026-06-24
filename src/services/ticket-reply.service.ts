import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import {
  getDeskproSubmitReplyGraphqlPath,
  getDeskproSubmitReplyUrl,
} from "@/lib/deskpro-endpoints";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import { getSession } from "@/lib/session";
import { loadAuth } from "@/services/load-auth.service";
import { logTicketReplyToSupabase } from "@/services/ticket-reply-log.service";
import {
  buildReplyHtml,
  normalizeSubmitTicketReplyResponse,
  type ReplyAttachment,
  type ReplyMessageType,
  type ReplyStatusId,
  type SubmitTicketReplyResponse,
} from "@/types/ticket-reply";

const SUBMIT_REPLY_HASH =
  "c36f4797bc3388080a3dfc0cbb05662dfdef6570fac6490e5af39f3c97135926";

export type SubmitTicketReplyParams = {
  ticketId: string;
  message: string;
  statusId: ReplyStatusId;
  messageType: ReplyMessageType;
  attachments?: ReplyAttachment[];
};

function collectGraphqlErrors(data: unknown): unknown[] {
  const errors: unknown[] = [];

  function walk(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (typeof value !== "object" || value == null) {
      return;
    }

    if (Array.isArray((value as { errors?: unknown[] }).errors)) {
      errors.push(...((value as { errors: unknown[] }).errors ?? []));
    }

    if ("data" in value && typeof value.data === "object") {
      walk(value.data);
    }
  }

  walk(data);
  return errors;
}

function formatGraphqlErrors(errors: unknown[]): string {
  const messages = errors
    .map((error) => {
      if (typeof error === "object" && error != null && "message" in error) {
        return String((error as { message: unknown }).message);
      }

      return null;
    })
    .filter((message): message is string => Boolean(message));

  return messages.length > 0 ? messages.join("; ") : "Unknown GraphQL error";
}

function summarizeResponse(data: unknown): string {
  try {
    return JSON.stringify(data).slice(0, 300);
  } catch {
    return String(data);
  }
}

async function ensureAgentContext(session: Awaited<ReturnType<typeof getSession>>) {
  if (session.agentId && session.agentTeamId) {
    return {
      agentId: session.agentId,
      agentTeamId: session.agentTeamId,
    };
  }

  const authResult = await loadAuth(session.deskproCookies, session.accessToken);
  session.agentId = authResult.agentId;
  session.agentTeamId = authResult.agentTeamId;
  await session.save();

  if (!session.agentId || !session.agentTeamId) {
    throw new Error("Agent context not found in LoadAuth response");
  }

  return {
    agentId: session.agentId,
    agentTeamId: session.agentTeamId,
  };
}

function buildSubmitReplyPayload(params: {
  ticketId: string;
  messageHtml: string;
  statusId: ReplyStatusId;
  messageType: ReplyMessageType;
  agentId: string;
  agentTeamId: string;
  attachments: ReplyAttachment[];
}) {
  return {
    operationName: "SubmitReply",
    variables: {
      ticketId: params.ticketId,
      message: {
        messageHtml: params.messageHtml,
        messageSource: params.messageHtml,
        messageSourceType: "html",
        isNote: params.messageType === "note",
        emailUser: true,
        primaryTranslation: null,
        usedSnippetTransIds: [],
        attachments: params.attachments.map((attachment) => ({
          uploadRequestId: attachment.uploadRequestId,
          isInline: attachment.isInline,
        })),
      },
      actions: {
        runMacros: [],
        setCcs: [],
        addChargeTime: 0,
        setAgentTeamId: params.agentTeamId,
        setAgentId: params.agentId,
        setStatusId: params.statusId,
      },
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: SUBMIT_REPLY_HASH,
      },
    },
  };
}

export async function submitTicketReply(
  params: SubmitTicketReplyParams,
): Promise<SubmitTicketReplyResponse> {
  const session = await getSession();

  if (!session.authenticated || !session.accessToken) {
    throw new UnauthorizedError();
  }

  const attachments = params.attachments ?? [];
  const { agentId, agentTeamId } = await ensureAgentContext(session);
  const inlineDownloadUrls = attachments
    .filter((attachment) => attachment.isInline && attachment.downloadUrl)
    .map((attachment) => attachment.downloadUrl as string);
  const messageHtml = buildReplyHtml(params.message, inlineDownloadUrls);
  const payload = buildSubmitReplyPayload({
    ticketId: params.ticketId,
    messageHtml,
    statusId: params.statusId,
    messageType: params.messageType,
    agentId,
    agentTeamId,
    attachments,
  });

  console.info(
    "[TicketReply] Submitting reply:",
    getDeskproSubmitReplyUrl(),
    {
      ticketId: params.ticketId,
      agentId,
      agentTeamId,
      statusId: params.statusId,
      messageType: params.messageType,
      attachmentCount: attachments.length,
      path: getDeskproSubmitReplyGraphqlPath(),
    },
  );

  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      getDeskproSubmitReplyGraphqlPath(),
      payload,
    );

    const graphqlErrors = collectGraphqlErrors(data);
    if (graphqlErrors.length > 0) {
      const message = formatGraphqlErrors(graphqlErrors);
      console.error("[TicketReply] GraphQL errors:", graphqlErrors);
      throw new Error(`Failed to submit ticket reply: ${message}`);
    }

    const response = normalizeSubmitTicketReplyResponse(
      data,
      params.statusId,
      params.messageType,
    );

    void logTicketReplyToSupabase({
      ticketId: params.ticketId,
      deskproMessageId: response.messageId,
      messageNumber: response.messageNumber,
      agentId,
      agentTeamId,
      messageType: params.messageType,
      statusId: params.statusId,
      messageBody: params.message,
      attachments,
      deskproSentAt: response.dateCreated,
    }).catch((logError) => {
      console.error("[TicketReplyLog] Non-blocking log failed:", logError);
    });

    return response;
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? "unknown";
      const preview = summarizeResponse(error.response?.data);
      console.error(
        "[TicketReply] HTTP error:",
        status,
        error.response?.data,
      );
      throw new Error(
        `Failed to submit ticket reply (HTTP ${status}): ${preview}`,
      );
    }

    throw error;
  }
}
