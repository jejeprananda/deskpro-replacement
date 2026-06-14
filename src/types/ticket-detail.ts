import { z } from "zod";
import {
  extractTicketFieldNumericId,
  getTicketDetailFieldLabel,
  selectVisibleTicketDetailFields,
} from "@/lib/ticket-detail-fields";

const customChoiceOptionSchema = z.object({
  title: z.string(),
});

const customChoiceValueSchema = z.object({
  id: z.string(),
  selected: z.array(customChoiceOptionSchema).optional(),
  __typename: z.literal("CustomChoiceValue").optional(),
});

const customInputValueSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.number()]).optional(),
  __typename: z.literal("CustomInputValue").optional(),
});

const fieldSchema = z.union([customChoiceValueSchema, customInputValueSchema]);

const loadTicketFieldValuesEntrySchema = z.object({
  data: z.object({
    ticket: z.object({
      id: z.union([z.string(), z.number()]),
      fields: z.array(fieldSchema).optional(),
      organization: z
        .object({
          fields: z.array(fieldSchema).optional(),
        })
        .nullable()
        .optional(),
    }),
  }),
});

const blobSchema = z.object({
  filename: z.string(),
  filesize: z.number(),
  content_type: z.string(),
  download_url: z.string().optional(),
  file_url: z.string().optional(),
});

const attachmentSchema = z.object({
  id: z.union([z.string(), z.number()]),
  blob: blobSchema,
});

const messageSchema = z.object({
  id: z.union([z.string(), z.number()]),
  messageNumber: z.number(),
  message: z.string(),
  date_created: z.string(),
  __typename: z.string().optional(),
  is_note: z.boolean().optional(),
  creationSystem: z.string().optional(),
  clientDetails: z.unknown().nullable().optional(),
  emailDetails: z.unknown().nullable().optional(),
  person: z
    .object({
      id: z.union([z.string(), z.number()]).nullable().optional(),
    })
    .nullable()
    .optional(),
  attachments: z.array(attachmentSchema).optional(),
});

const ticketMessagesEntrySchema = z.object({
  data: z.object({
    ticket: z.object({
      id: z.union([z.string(), z.number()]),
      last_channel_used: z.string().nullable().optional(),
      messages: z.object({
        totalCount: z.number(),
        edges: z.array(
          z.object({
            message: messageSchema,
          }),
        ),
      }),
    }),
  }),
});

const ticketDetailResponseSchema = z.array(z.unknown());

export type TicketDetailField = {
  id: string;
  fieldKey: string;
  label: string;
  value: string;
};

export type AttachmentAction = "preview" | "openTab" | "download";

export type TicketMessageAttachment = {
  id: string;
  messageId: string;
  filename: string;
  contentType: string;
  filesize: number;
  isImage: boolean;
  action: AttachmentAction;
};

export type TicketMessageKind = "user" | "agent" | "note" | "unknown";

export type TicketMessage = {
  id: string;
  messageNumber: number;
  kind: TicketMessageKind;
  html: string;
  dateCreated: string;
  personId: string | null;
  attachments: TicketMessageAttachment[];
};

export type TicketDetailSummary = {
  lastChannelUsed: string | null;
  dateCreated: string | null;
};

export type TicketDetailResponse = {
  ticketId: string;
  summary: TicketDetailSummary;
  fields: TicketDetailField[];
  organizationFields: TicketDetailField[];
  messages: TicketMessage[];
  messageTotalCount: number;
  hasMoreMessages: boolean;
};

export const ticketDetailQuerySchema = z.object({
  ownerId: z.string().optional(),
});

export const attachmentContentQuerySchema = z.object({
  filename: z
    .string()
    .min(1)
    .refine(
      (value) => !value.includes("..") && !value.includes("/"),
      "Invalid filename",
    ),
  disposition: z.enum(["inline", "attachment"]).default("attachment"),
});

export const messageAttachmentParamsSchema = z.object({
  messageId: z.string().min(1),
});

export const attachmentFileQuerySchema = z.object({
  key: z
    .string()
    .min(1)
    .refine((value) => !value.includes(".."), "Invalid file key"),
  name: z
    .string()
    .min(1)
    .refine(
      (value) => !value.includes("..") && !value.includes("/"),
      "Invalid filename",
    ),
});

export function extractFileKey(downloadUrl: string): string | null {
  const match = downloadUrl.match(/\/attachment\/([^/]+)\//);
  return match?.[1] ?? null;
}

export type DeskproAttachmentLink = {
  fileKey: string;
  filename: string;
};

function parseDeskproFileLink(
  fileKey: string,
  rawFilename: string,
): DeskproAttachmentLink | null {
  const filename = decodeURIComponent(rawFilename);

  if (!filename || filename.includes("..") || filename.includes("/")) {
    return null;
  }

  return { fileKey, filename };
}

export function parseDeskproAttachmentHref(
  href: string,
): DeskproAttachmentLink | null {
  const fileKey = extractFileKey(href);
  if (!fileKey) {
    return null;
  }

  const filenameMatch = href.match(/\/attachment\/[^/]+\/([^/?#]+)/);
  const rawFilename = filenameMatch?.[1];

  if (!rawFilename) {
    return null;
  }

  return parseDeskproFileLink(fileKey, rawFilename);
}

export function parseDeskproFilePhpUrl(href: string): DeskproAttachmentLink | null {
  const match = href.match(/\/file\.php\/([^/]+)\/([^/?#]+)/);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  return parseDeskproFileLink(match[1], match[2]);
}

export function parseDeskproFileUrl(href: string): DeskproAttachmentLink | null {
  return parseDeskproAttachmentHref(href) ?? parseDeskproFilePhpUrl(href);
}

const DESKPRO_ATTACHMENT_URL_PATTERN =
  /(?:https?:\/\/[^"'\\s]*)?\/agent\/link\/ticket\/attachment\/([^/"'\\s]+)\/([^"'\\s?#]+)/gi;

const DESKPRO_FILE_PHP_URL_PATTERN =
  /(?:https?:\/\/[^"'\\s]*)?\/file\.php\/([^/"'\\s]+)\/([^"'\\s?#]+)(?:\?[^"'\\s>]*)?/gi;

function replaceDeskproUrlWithProxy(
  match: string,
  fileKey: string,
  rawFilename: string,
): string {
  const parsed = parseDeskproFileLink(fileKey, rawFilename);
  if (!parsed) {
    return match;
  }

  return buildAttachmentProxyUrl(parsed.fileKey, parsed.filename);
}

export function rewriteMessageAttachmentUrls(html: string): string {
  if (!html) {
    return html;
  }

  return html
    .replace(DESKPRO_ATTACHMENT_URL_PATTERN, replaceDeskproUrlWithProxy)
    .replace(DESKPRO_FILE_PHP_URL_PATTERN, replaceDeskproUrlWithProxy);
}

export function getDeskproLinkAction(href: string): AttachmentAction | null {
  const parsed = parseDeskproFileUrl(href);
  if (!parsed) {
    return null;
  }

  return getAttachmentAction("", parsed.filename);
}

export function isImageAttachment(
  contentType: string,
  filename: string,
): boolean {
  if (contentType.toLowerCase().startsWith("image/")) {
    return true;
  }

  const lowerFilename = filename.toLowerCase();
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
  ];

  return imageExtensions.some((extension) =>
    lowerFilename.endsWith(extension),
  );
}

export function isPdfAttachment(
  contentType: string,
  filename: string,
): boolean {
  const normalizedType = contentType.toLowerCase();

  if (normalizedType === "application/pdf") {
    return true;
  }

  return filename.toLowerCase().endsWith(".pdf");
}

export function isDocAttachment(
  contentType: string,
  filename: string,
): boolean {
  const normalizedType = contentType.toLowerCase();
  const docTypes = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (docTypes.includes(normalizedType)) {
    return true;
  }

  const lowerFilename = filename.toLowerCase();
  return lowerFilename.endsWith(".doc") || lowerFilename.endsWith(".docx");
}

export function getAttachmentAction(
  contentType: string,
  filename: string,
): AttachmentAction {
  if (isImageAttachment(contentType, filename)) {
    return "preview";
  }

  if (isPdfAttachment(contentType, filename)) {
    return "openTab";
  }

  return "download";
}

export function buildAttachmentProxyUrl(
  fileKey: string,
  filename: string,
): string {
  const params = new URLSearchParams({
    key: fileKey,
    name: filename,
  });

  return `/api/deskpro/files?${params.toString()}`;
}

export function buildMessageAttachmentUrl(
  messageId: string,
  filename: string,
  disposition: "inline" | "attachment",
): string {
  const params = new URLSearchParams({
    filename,
    disposition,
  });

  return `/api/deskpro/messages/${encodeURIComponent(messageId)}/attachment?${params.toString()}`;
}

export function getAttachmentDisposition(
  action: AttachmentAction,
): "inline" | "attachment" {
  return action === "download" ? "attachment" : "inline";
}

function mapAttachment(
  attachment: z.infer<typeof attachmentSchema>,
  messageId: string,
): TicketMessageAttachment {
  const filename = attachment.blob.filename;
  const contentType = attachment.blob.content_type;

  return {
    id: String(attachment.id),
    messageId,
    filename,
    contentType,
    filesize: attachment.blob.filesize,
    isImage: isImageAttachment(contentType, filename),
    action: getAttachmentAction(contentType, filename),
  };
}

export function resolveMessageKind(
  raw: z.infer<typeof messageSchema>,
): TicketMessageKind {
  const typename = raw.__typename?.trim() ?? "";

  if (raw.is_note === true || typename.includes("Note")) {
    return "note";
  }

  if (
    typename === "TicketMessageAgent" ||
    raw.emailDetails != null ||
    raw.creationSystem === "EMAIL"
  ) {
    return "agent";
  }

  if (
    typename === "TicketMessageUser" ||
    raw.creationSystem === "FORM" ||
    (raw.clientDetails != null && raw.emailDetails == null)
  ) {
    return "user";
  }

  return "unknown";
}

function mapField(raw: z.infer<typeof fieldSchema>): TicketDetailField | null {
  const fieldKey = extractTicketFieldNumericId(raw.id);
  if (!fieldKey) {
    return null;
  }

  const label = getTicketDetailFieldLabel(fieldKey);

  if ("selected" in raw && raw.selected?.length) {
    return {
      id: raw.id,
      fieldKey,
      label,
      value: raw.selected.map((item) => item.title).join(", "),
    };
  }

  if ("value" in raw && raw.value != null && raw.value !== "") {
    return {
      id: raw.id,
      fieldKey,
      label,
      value: String(raw.value),
    };
  }

  return null;
}

function mapFields(
  fields: z.infer<typeof fieldSchema>[] | undefined,
): TicketDetailField[] {
  if (!fields) {
    return [];
  }

  return fields
    .map(mapField)
    .filter((field): field is TicketDetailField => field != null);
}

function mapMessage(raw: z.infer<typeof messageSchema>): TicketMessage {
  return {
    id: String(raw.id),
    messageNumber: raw.messageNumber,
    kind: resolveMessageKind(raw),
    html: raw.message,
    dateCreated: raw.date_created,
    personId: raw.person?.id != null ? String(raw.person.id) : null,
    attachments: (raw.attachments ?? []).map((attachment) =>
      mapAttachment(attachment, String(raw.id)),
    ),
  };
}

function parseMessagesEntries(entries: unknown[]): {
  messages: TicketMessage[];
  totalCount: number;
  lastChannelUsed: string | null;
} {
  const messageMap = new Map<string, TicketMessage>();
  let totalCount = 0;
  let lastChannelUsed: string | null = null;

  for (const entry of entries) {
    const parsed = ticketMessagesEntrySchema.safeParse(entry);
    if (!parsed.success) {
      continue;
    }

    if (parsed.data.data.ticket.last_channel_used) {
      lastChannelUsed = parsed.data.data.ticket.last_channel_used;
    }

    totalCount = Math.max(
      totalCount,
      parsed.data.data.ticket.messages.totalCount,
    );

    for (const edge of parsed.data.data.ticket.messages.edges) {
      const mapped = mapMessage(edge.message);
      messageMap.set(mapped.id, mapped);
    }
  }

  const messages = [...messageMap.values()].sort(
    (left, right) =>
      new Date(left.dateCreated).getTime() -
      new Date(right.dateCreated).getTime(),
  );

  return { messages, totalCount, lastChannelUsed };
}

export function normalizeTicketDetail(
  data: unknown,
  ticketId: string,
): TicketDetailResponse {
  const parsed = ticketDetailResponseSchema.parse(data);

  const fieldEntry = parsed.find((entry) => {
    const result = loadTicketFieldValuesEntrySchema.safeParse(entry);
    return result.success;
  });

  const fieldValues = fieldEntry
    ? loadTicketFieldValuesEntrySchema.parse(fieldEntry)
    : null;

  const messageEntries = parsed.filter((entry) => {
    return ticketMessagesEntrySchema.safeParse(entry).success;
  });

  const { messages, totalCount, lastChannelUsed } =
    parseMessagesEntries(messageEntries);
  const allFields = [
    ...mapFields(fieldValues?.data.ticket.fields),
    ...mapFields(fieldValues?.data.ticket.organization?.fields),
  ];
  const oldestMessageDate = messages[0]?.dateCreated ?? null;

  return {
    ticketId,
    summary: {
      lastChannelUsed,
      dateCreated: oldestMessageDate,
    },
    fields: selectVisibleTicketDetailFields(allFields),
    organizationFields: [],
    messages,
    messageTotalCount: totalCount,
    hasMoreMessages: totalCount > messages.length,
  };
}
