import axios from "axios";
import { DeskproClient } from "@/lib/deskpro-client";
import { DeskproTimeoutError, UnauthorizedError } from "@/lib/errors";
import {
  normalizeTopLevelSnippets,
  type TopLevelSnippetsResponse,
} from "@/types/top-level-snippets";

const TOP_LEVEL_SNIPPETS_HASH =
  "f594dbe6ecb987f1d7578b3ecb23a06573ad81a6c88c96559a6e83c0a45c7106";

const TOP_LEVEL_SNIPPETS_PAYLOAD = {
  operationName: "TopLevelSnippets",
  variables: {},
  extensions: {
    persistedQuery: {
      version: 1,
      sha256Hash: TOP_LEVEL_SNIPPETS_HASH,
    },
  },
} as const;

export async function fetchTopLevelSnippets(): Promise<TopLevelSnippetsResponse> {
  try {
    const client = await DeskproClient.fromSession();
    const data = await client.post<unknown>(
      "/graphql/TopLevelSnippets",
      TOP_LEVEL_SNIPPETS_PAYLOAD,
    );

    return normalizeTopLevelSnippets(data);
  } catch (error) {
    if (
      error instanceof UnauthorizedError ||
      error instanceof DeskproTimeoutError
    ) {
      throw error;
    }

    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw new UnauthorizedError();
    }

    throw error;
  }
}
