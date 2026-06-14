import { z } from "zod";

export type PersonalSnippet = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type PersonalSnippetsResponse = {
  snippets: PersonalSnippet[];
  totalCount: number;
};

export const createPersonalSnippetSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(20_000),
});

export const updatePersonalSnippetSchema = createPersonalSnippetSchema;

export type CreatePersonalSnippetInput = z.infer<
  typeof createPersonalSnippetSchema
>;

export type UpdatePersonalSnippetInput = z.infer<
  typeof updatePersonalSnippetSchema
>;

export const personalSnippetParamsSchema = z.object({
  id: z.string().uuid(),
});
