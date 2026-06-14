"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type {
  CreatePersonalSnippetInput,
  PersonalSnippet,
  PersonalSnippetsResponse,
  UpdatePersonalSnippetInput,
} from "@/types/personal-snippet";

const QUERY_KEY = ["personal-snippets"] as const;

async function fetchPersonalSnippets(): Promise<PersonalSnippetsResponse> {
  const { data } = await axios.get<PersonalSnippetsResponse>(
    "/api/personal-snippets",
  );
  return data;
}

async function createPersonalSnippetRequest(
  input: CreatePersonalSnippetInput,
): Promise<PersonalSnippet> {
  const { data } = await axios.post<PersonalSnippet>(
    "/api/personal-snippets",
    input,
  );
  return data;
}

async function updatePersonalSnippetRequest(
  id: string,
  input: UpdatePersonalSnippetInput,
): Promise<PersonalSnippet> {
  const { data } = await axios.put<PersonalSnippet>(
    `/api/personal-snippets/${encodeURIComponent(id)}`,
    input,
  );
  return data;
}

async function deletePersonalSnippetRequest(id: string): Promise<void> {
  await axios.delete(`/api/personal-snippets/${encodeURIComponent(id)}`);
}

export function usePersonalSnippets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPersonalSnippets,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: createPersonalSnippetRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePersonalSnippetInput;
    }) => updatePersonalSnippetRequest(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePersonalSnippetRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    query,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
