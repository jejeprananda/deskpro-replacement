import { getDatabase } from "@/lib/db";
import type {
  CreatePersonalSnippetInput,
  PersonalSnippet,
  UpdatePersonalSnippetInput,
} from "@/types/personal-snippet";

type PersonalSnippetRow = {
  id: string;
  agent_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: PersonalSnippetRow): PersonalSnippet {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listPersonalSnippets(agentId: string): PersonalSnippet[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, agent_id, title, body, created_at, updated_at
       FROM personal_snippets
       WHERE agent_id = ?
       ORDER BY updated_at DESC`,
    )
    .all(agentId) as PersonalSnippetRow[];

  return rows.map(mapRow);
}

export function createPersonalSnippet(
  agentId: string,
  input: CreatePersonalSnippetInput,
): PersonalSnippet {
  const db = getDatabase();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO personal_snippets (id, agent_id, title, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, agentId, input.title, input.body, now, now);

  return {
    id,
    title: input.title,
    body: input.body,
    createdAt: now,
    updatedAt: now,
  };
}

export function updatePersonalSnippet(
  agentId: string,
  id: string,
  input: UpdatePersonalSnippetInput,
): PersonalSnippet | null {
  const db = getDatabase();
  const existing = db
    .prepare(
      `SELECT id, agent_id, title, body, created_at, updated_at
       FROM personal_snippets
       WHERE id = ? AND agent_id = ?`,
    )
    .get(id, agentId) as PersonalSnippetRow | undefined;

  if (!existing) {
    return null;
  }

  const updatedAt = new Date().toISOString();

  db.prepare(
    `UPDATE personal_snippets
     SET title = ?, body = ?, updated_at = ?
     WHERE id = ? AND agent_id = ?`,
  ).run(input.title, input.body, updatedAt, id, agentId);

  return {
    id,
    title: input.title,
    body: input.body,
    createdAt: existing.created_at,
    updatedAt,
  };
}

export function deletePersonalSnippet(
  agentId: string,
  id: string,
): boolean {
  const db = getDatabase();
  const result = db
    .prepare(`DELETE FROM personal_snippets WHERE id = ? AND agent_id = ?`)
    .run(id, agentId);

  return result.changes > 0;
}
