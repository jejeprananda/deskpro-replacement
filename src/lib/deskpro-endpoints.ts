const DEFAULT_DESKPRO_BASE_URL =
  "https://kemenkeu-prime.kemenkeu.go.id/agent-api";

export function getDeskproBaseUrl(): string {
  return process.env.DESKPRO_API_BASE_URL ?? DEFAULT_DESKPRO_BASE_URL;
}

/** POST https://kemenkeu-prime.kemenkeu.go.id/agent-api/authenticate/login */
export function getDeskproLoginUrl(): string {
  return `${getDeskproBaseUrl()}/authenticate/login`;
}

/** POST https://kemenkeu-prime.kemenkeu.go.id/agent-api/graphql/LoadAuth */
export function getDeskproLoadAuthUrl(): string {
  return `${getDeskproBaseUrl()}/graphql/LoadAuth`;
}

/** POST .../agent-api/graphql/TicketFilterCount,TicketFilterCount */
export function getDeskproTicketFilterCountUrl(): string {
  return `${getDeskproBaseUrl()}/graphql/TicketFilterCount,TicketFilterCount`;
}

/** POST .../agent-api/graphql/TicketFqlGrouped */
export function getDeskproTicketFqlGroupedUrl(): string {
  return `${getDeskproBaseUrl()}/graphql/TicketFqlGrouped`;
}

/** POST .../agent-api/graphql/SearchAppTickets */
export function getDeskproSearchAppTicketsPath(): string {
  return "/graphql/SearchAppTickets";
}

/** POST .../agent-api/graphql/AgentForClientSearch */
export function getDeskproAgentForClientSearchUrl(): string {
  return `${getDeskproBaseUrl()}/graphql/AgentForClientSearch`;
}

/** POST .../agent-api/graphql/LoadTicketFieldValues,TicketMacros,TicketMessages */
export function getDeskproTicketDetailUrl(): string {
  return `${getDeskproBaseUrl()}/graphql/LoadTicketFieldValues,TicketMacros,TicketMessages`;
}

export function getDeskproSiteUrl(): string {
  return getDeskproBaseUrl().replace(/\/agent-api\/?$/, "");
}

/** POST .../agent-api/graphql/TicketMessageAttachmentsDownloadUrl */
export function getDeskproAttachmentDownloadUrlGraphqlPath(): string {
  return "/graphql/TicketMessageAttachmentsDownloadUrl";
}

/** POST .../agent-api/graphql/SubmitReply */
export function getDeskproSubmitReplyGraphqlPath(): string {
  return "/graphql/SubmitReply";
}

/** POST .../agent-api/graphql/TicketsMassActions */
export function getDeskproTicketsMassActionsGraphqlPath(): string {
  return "/graphql/TicketsMassActions";
}

/** POST https://kemenkeu-prime.kemenkeu.go.id/agent-api/graphql/SubmitReply */
export function getDeskproSubmitReplyUrl(): string {
  return `${getDeskproBaseUrl()}${getDeskproSubmitReplyGraphqlPath()}`;
}

/** POST .../agent-api/graphql/GenerateBlobUploadRequest */
export function getDeskproGenerateBlobUploadRequestPath(): string {
  return "/graphql/GenerateBlobUploadRequest";
}

/** POST .../agent-api/blob-uploader/upload */
export function getDeskproBlobUploaderUrl(): string {
  return `${getDeskproBaseUrl()}/blob-uploader/upload`;
}

export function getDeskproFileUrl(
  fileKey: string,
  filename: string,
  accessToken: string,
): string {
  return `${getDeskproSiteUrl()}/file.php/${encodeURIComponent(fileKey)}/${encodeURIComponent(filename)}?access_token=${encodeURIComponent(accessToken)}`;
}
