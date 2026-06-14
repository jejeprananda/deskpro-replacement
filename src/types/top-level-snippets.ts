import { z } from "zod";

const snippetShortCodeSchema = z.object({
  code: z.string(),
});

const snippetTranslationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  content: z.string(),
});

const snippetSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  shortCodes: z.array(snippetShortCodeSchema).default([]),
  translations: z.array(snippetTranslationSchema).default([]),
});

const topLevelSnippetsResponseSchema = z.object({
  data: z.object({
    snippets: z.object({
      snippets: z.array(snippetSchema),
      totalCount: z.number(),
    }),
  }),
});

export type SnippetItem = {
  id: string;
  title: string;
  shortCode: string | null;
  translationId: string;
  contentRaw: string;
};

export type TopLevelSnippetsResponse = {
  snippets: SnippetItem[];
  totalCount: number;
};

export function normalizeTopLevelSnippets(
  data: unknown,
): TopLevelSnippetsResponse {
  const parsed = topLevelSnippetsResponseSchema.parse(data);
  const rawSnippets = parsed.data.snippets.snippets;

  const snippets: SnippetItem[] = [];

  for (const snippet of rawSnippets) {
    const translation = snippet.translations[0];
    if (!translation) {
      continue;
    }

    snippets.push({
      id: String(snippet.id),
      title: snippet.title,
      shortCode: snippet.shortCodes[0]?.code ?? null,
      translationId: String(translation.id),
      contentRaw: translation.content,
    });
  }

  return {
    snippets,
    totalCount: parsed.data.snippets.totalCount,
  };
}
