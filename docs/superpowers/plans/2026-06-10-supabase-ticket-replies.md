# Supabase Ticket Reply Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap agent mengirim balasan tiket ("jawaban tiket") via flow Deskpro yang sudah ada, salinan log disimpan ke Supabase Postgres project **Deskpro** (`wldegzqooyzzyxoztxsp`) tanpa mengganggu upstream Deskpro sebagai source of truth.

**Architecture:** Buat table `ticket_replies` di Supabase via MCP `apply_migration`. Di app Next.js Deskpro, tambah `@supabase/supabase-js` server client (service role, server-only). Setelah `submitTicketReply()` sukses ke Deskpro GraphQL, panggil `logTicketReplyToSupabase()` sebagai side-effect **non-blocking** — gagal log ke Supabase tidak boleh gagalkan balasan ke user. Opsional: route GET untuk audit per ticket.

**Tech Stack:** Next.js 16, TypeScript, Zod, Supabase Postgres, Supabase MCP plugin, `@supabase/supabase-js`

**Target project:** `/home/jeje/Documents/Code/deskpro`  
**Supabase project ID:** `wldegzqooyzzyxoztxsp`

---

## File Map

| File | Responsibility |
|------|----------------|
| Supabase migration (via MCP) | DDL `ticket_replies` + RLS |
| `.env.example` | Document Supabase env vars |
| `src/lib/supabase-server.ts` | Singleton Supabase admin client |
| `src/types/ticket-reply-log.ts` | Zod schemas + TS types |
| `src/services/ticket-reply-log.service.ts` | Insert + list reply logs |
| `src/services/ticket-reply.service.ts` | Hook log after successful SubmitReply |
| `src/app/api/ticket-replies/[ticketId]/route.ts` | GET logs for authenticated agent (optional audit) |

---

### Task 1: Create Supabase table via MCP migration

**Tool:** Supabase MCP `apply_migration`

- [ ] **Step 1: Apply migration**

Call MCP tool `apply_migration` with:

```json
{
  "project_id": "wldegzqooyzzyxoztxsp",
  "name": "create_ticket_replies",
  "query": "-- SQL below"
}
```

SQL:

```sql
CREATE TABLE public.ticket_replies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id           text NOT NULL,
  deskpro_message_id  text NOT NULL,
  message_number      integer NOT NULL,
  agent_id            text NOT NULL,
  agent_team_id       text,
  message_type        text NOT NULL CHECK (message_type IN ('email', 'note')),
  status_id           text NOT NULL CHECK (status_id IN ('awaiting_agent', 'awaiting_user')),
  message_body        text NOT NULL,
  attachments         jsonb NOT NULL DEFAULT '[]'::jsonb,
  deskpro_sent_at     timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ticket_replies_ticket_id_idx ON public.ticket_replies (ticket_id);
CREATE INDEX ticket_replies_agent_id_idx ON public.ticket_replies (agent_id);
CREATE INDEX ticket_replies_created_at_idx ON public.ticket_replies (created_at DESC);

ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

-- No public/client policies: all access via service role on server only.
REVOKE ALL ON public.ticket_replies FROM anon, authenticated;
GRANT ALL ON public.ticket_replies TO service_role;
```

- [ ] **Step 2: Verify table exists**

Call MCP `list_tables` with `project_id: wldegzqooyzzyxoztxsp`.

Expected: `ticket_replies` appears in public schema.

- [ ] **Step 3: Commit migration note**

```bash
cd /home/jeje/Documents/Code/deskpro
git add docs/superpowers/plans/2026-06-10-supabase-ticket-replies.md
git commit -m "docs: add supabase ticket reply logging plan"
```

---

### Task 2: Add environment variables

**Files:**
- Modify: `/home/jeje/Documents/Code/deskpro/.env.example`

- [ ] **Step 1: Append Supabase vars to `.env.example`**

```env
# Supabase (server-only — never expose SERVICE_ROLE to browser)
NEXT_PUBLIC_SUPABASE_URL=https://wldegzqooyzzyxoztxsp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 2: Add real keys to local `.env.local`** (manual, not committed)

Run MCP `get_publishable_keys` and Supabase Dashboard → Settings → API for **service_role** key.

```env
NEXT_PUBLIC_SUPABASE_URL=https://wldegzqooyzzyxoztxsp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from-dashboard>
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: document supabase env vars for ticket reply logging"
```

---

### Task 3: Install Supabase client

**Files:**
- Modify: `/home/jeje/Documents/Code/deskpro/package.json`

- [ ] **Step 1: Install dependency**

```bash
cd /home/jeje/Documents/Code/deskpro
npm install @supabase/supabase-js
```

- [ ] **Step 2: Verify install**

```bash
npm ls @supabase/supabase-js
```

Expected: package listed without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/supabase-js"
```

---

### Task 4: Supabase server client

**Files:**
- Create: `/home/jeje/Documents/Code/deskpro/src/lib/supabase-server.ts`

- [ ] **Step 1: Create server client**

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function getSupabaseAdmin(): SupabaseClient {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(config.url, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return supabaseAdmin;
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /home/jeje/Documents/Code/deskpro
npx tsc --noEmit
```

Expected: no errors in `supabase-server.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase-server.ts
git commit -m "feat: add supabase server admin client"
```

---

### Task 5: Ticket reply log types

**Files:**
- Create: `/home/jeje/Documents/Code/deskpro/src/types/ticket-reply-log.ts`

- [ ] **Step 1: Create types file**

```typescript
import { z } from "zod";
import {
  replyMessageTypeSchema,
  replyStatusIdSchema,
  replyAttachmentSchema,
} from "@/types/ticket-reply";

export const ticketReplyLogRowSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string(),
  deskpro_message_id: z.string(),
  message_number: z.number().int(),
  agent_id: z.string(),
  agent_team_id: z.string().nullable(),
  message_type: replyMessageTypeSchema,
  status_id: replyStatusIdSchema,
  message_body: z.string(),
  attachments: z.array(replyAttachmentSchema),
  deskpro_sent_at: z.string().nullable(),
  created_at: z.string(),
});

export type TicketReplyLogRow = z.infer<typeof ticketReplyLogRowSchema>;

export type TicketReplyLog = {
  id: string;
  ticketId: string;
  deskproMessageId: string;
  messageNumber: number;
  agentId: string;
  agentTeamId: string | null;
  messageType: z.infer<typeof replyMessageTypeSchema>;
  statusId: z.infer<typeof replyStatusIdSchema>;
  messageBody: string;
  attachments: z.infer<typeof replyAttachmentSchema>[];
  deskproSentAt: string | null;
  createdAt: string;
};

export const createTicketReplyLogInputSchema = z.object({
  ticketId: z.string().min(1),
  deskproMessageId: z.string().min(1),
  messageNumber: z.number().int().positive(),
  agentId: z.string().min(1),
  agentTeamId: z.string().optional(),
  messageType: replyMessageTypeSchema,
  statusId: replyStatusIdSchema,
  messageBody: z.string().min(1),
  attachments: z.array(replyAttachmentSchema).default([]),
  deskproSentAt: z.string().optional(),
});

export type CreateTicketReplyLogInput = z.infer<
  typeof createTicketReplyLogInputSchema
>;

export function mapTicketReplyLogRow(row: TicketReplyLogRow): TicketReplyLog {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    deskproMessageId: row.deskpro_message_id,
    messageNumber: row.message_number,
    agentId: row.agent_id,
    agentTeamId: row.agent_team_id,
    messageType: row.message_type,
    statusId: row.status_id,
    messageBody: row.message_body,
    attachments: row.attachments,
    deskproSentAt: row.deskpro_sent_at,
    createdAt: row.created_at,
  };
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/types/ticket-reply-log.ts
git commit -m "feat: add ticket reply log types"
```

---

### Task 6: Ticket reply log service

**Files:**
- Create: `/home/jeje/Documents/Code/deskpro/src/services/ticket-reply-log.service.ts`

- [ ] **Step 1: Create service**

```typescript
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import {
  createTicketReplyLogInputSchema,
  mapTicketReplyLogRow,
  ticketReplyLogRowSchema,
  type CreateTicketReplyLogInput,
  type TicketReplyLog,
} from "@/types/ticket-reply-log";

export async function logTicketReplyToSupabase(
  input: CreateTicketReplyLogInput,
): Promise<TicketReplyLog | null> {
  if (!isSupabaseConfigured()) {
    console.warn("[TicketReplyLog] Supabase not configured, skipping log");
    return null;
  }

  const parsed = createTicketReplyLogInputSchema.parse(input);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("ticket_replies")
    .insert({
      ticket_id: parsed.ticketId,
      deskpro_message_id: parsed.deskproMessageId,
      message_number: parsed.messageNumber,
      agent_id: parsed.agentId,
      agent_team_id: parsed.agentTeamId ?? null,
      message_type: parsed.messageType,
      status_id: parsed.statusId,
      message_body: parsed.messageBody,
      attachments: parsed.attachments,
      deskpro_sent_at: parsed.deskproSentAt ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to log ticket reply: ${error.message}`);
  }

  return mapTicketReplyLogRow(ticketReplyLogRowSchema.parse(data));
}

export async function listTicketReplyLogs(
  ticketId: string,
): Promise<TicketReplyLog[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("ticket_replies")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list ticket reply logs: ${error.message}`);
  }

  return (data ?? []).map((row) =>
    mapTicketReplyLogRow(ticketReplyLogRowSchema.parse(row)),
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/services/ticket-reply-log.service.ts
git commit -m "feat: add ticket reply log service for supabase"
```

---

### Task 7: Hook into existing reply submission

**Files:**
- Modify: `/home/jeje/Documents/Code/deskpro/src/services/ticket-reply.service.ts`

- [ ] **Step 1: Add import at top of file**

```typescript
import { logTicketReplyToSupabase } from "@/services/ticket-reply-log.service";
```

- [ ] **Step 2: Replace return block in `submitTicketReply` (lines ~198-202)**

Find:

```typescript
    return normalizeSubmitTicketReplyResponse(
      data,
      params.statusId,
      params.messageType,
    );
```

Replace with:

```typescript
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
```

- [ ] **Step 3: Build check**

```bash
cd /home/jeje/Documents/Code/deskpro
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/services/ticket-reply.service.ts
git commit -m "feat: log successful ticket replies to supabase"
```

---

### Task 8: GET API route for reply logs (audit)

**Files:**
- Create: `/home/jeje/Documents/Code/deskpro/src/app/api/ticket-replies/[ticketId]/route.ts`

- [ ] **Step 1: Create route handler**

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedError } from "@/lib/errors";
import { getSession } from "@/lib/session";
import { listTicketReplyLogs } from "@/services/ticket-reply-log.service";

const ticketIdParamsSchema = z.object({
  ticketId: z.string().min(1),
});

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session.authenticated || !session.agentId) {
      throw new UnauthorizedError();
    }

    const { ticketId } = ticketIdParamsSchema.parse(await context.params);
    const logs = await listTicketReplyLogs(ticketId);

    return NextResponse.json({
      ticketId,
      logs,
      totalCount: logs.length,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request", errors: error.flatten() },
        { status: 400 },
      );
    }

    console.error("[GET /api/ticket-replies/[ticketId]]", error);

    return NextResponse.json(
      { message: "Failed to fetch ticket reply logs" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ticket-replies/[ticketId]/route.ts
git commit -m "feat: add GET API for ticket reply logs from supabase"
```

---

### Task 9: End-to-end verification

- [ ] **Step 1: Start dev server**

```bash
cd /home/jeje/Documents/Code/deskpro
npm run dev
```

- [ ] **Step 2: Login and submit a test reply**

1. Open `http://localhost:3000/login`
2. Login with Deskpro agent credentials
3. Open any ticket → compose balasan → submit

Expected: Reply succeeds in Deskpro UI (unchanged behavior).

- [ ] **Step 3: Verify row in Supabase via MCP**

Call MCP `execute_sql`:

```sql
SELECT id, ticket_id, deskpro_message_id, agent_id, message_type, status_id,
       left(message_body, 80) AS message_preview, created_at
FROM public.ticket_replies
ORDER BY created_at DESC
LIMIT 5;
```

Expected: At least 1 row matching the submitted reply.

- [ ] **Step 4: Verify GET API**

```bash
curl -s -b cookies.txt \
  "http://localhost:3000/api/ticket-replies/<TICKET_ID>" | jq
```

(Use browser session cookie or test while logged in.)

Expected: JSON `{ ticketId, logs: [...], totalCount }`.

- [ ] **Step 5: Verify non-blocking behavior**

Temporarily set wrong `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, restart dev, submit reply.

Expected: Reply still succeeds to Deskpro; console shows `[TicketReplyLog] Non-blocking log failed`.

Restore correct key after test.

- [ ] **Step 6: Lint**

```bash
npm run lint
```

Expected: no new errors.

---

## Security Notes

- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser or `NEXT_PUBLIC_*` prefix.
- RLS enabled with no anon/authenticated policies — only server service role writes/reads.
- Deskpro remains **source of truth** for live tickets; Supabase is an **audit log** only.
- Do not log full attachment binary — store attachment metadata JSON only (already in schema).

## Out of Scope (YAGNI)

- Replacing Deskpro message storage with Supabase
- Real-time sync of inbound user "jawaban"
- UI panel showing Supabase logs in ticket detail (can add later)
- Migrating personal snippets from SQLite to Supabase

---

## Spec Self-Review

| Requirement | Task |
|-------------|------|
| Create Supabase table | Task 1 |
| API send jawaban tiket to Supabase | Task 7 (auto on submit) |
| Use Supabase plugin (MCP) | Task 1, 9 |
| Non-breaking to existing reply flow | Task 7 (non-blocking) |
| Server-only credentials | Task 2, 4, Security Notes |
| Query/audit API | Task 8 |

No placeholders remain. Types consistent across Task 5–8.
