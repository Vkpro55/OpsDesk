# OpsDesk — Claude Instructions

Multi-tenant real-time support & ticketing platform (graded project, 100 marks, 50–65h budget).
Next.js client + Express/Socket.io server + MongoDB replica set + Redis + BullMQ.

## Context files (loaded every session — keep them current)

@.claude/knowledge.md
@.claude/architecture.md
@.claude/decisions.md
@.claude/coding-rules.md
@.claude/git-rules.md
@.claude/memory.md

| File | Holds | Update when |
|------|-------|-------------|
| `knowledge.md` | Requirements, domain rules, rubric, submission checklist | Requirements are clarified or change |
| `architecture.md` | System shape, data model, rooms, queues, folders | A component, collection, room, or queue is added/changed |
| `decisions.md` | ADR log — what was chosen and why | Any non-trivial choice is made or reversed |
| `coding-rules.md` | Rules all code must follow | A new convention is agreed |
| `git-rules.md` | Commit format, scopes, branching | A new scope or git convention is agreed |
| `memory.md` | Current state, progress, session log, open questions | **End of every session / major task** |

## Session protocol

1. **Start:** read `memory.md` → "Current focus" and "Open questions" before doing anything.
2. **During:** a choice between real alternatives → add an ADR to `decisions.md` (next number, status, why). Never silently contradict an `Accepted` ADR — propose a superseding one and ask.
3. **After any change git would see:** end the reply with a `📦 Suggested commit` block (format in `git-rules.md`). Suggest only; don't commit unless asked.
4. **End:** append a dated entry to the session log in `memory.md`, tick progress boxes, update "Current focus" and "Next steps".
5. Dates are absolute (`YYYY-MM-DD`), never "yesterday" / "last week".

## Non-negotiables (details in coding-rules.md)

- Tenant isolation lives in the **query layer** (Mongoose tenancy plugin + AsyncLocalStorage). Never rely on a controller remembering `orgId`.
- A customer socket must **never** receive an internal-note event. Internal notes go only to the `ticket:<id>:internal` room.
- Ticket status changes go through the state machine in `server/services/ticketStateMachine.js` — never set `status` directly.
- Multi-document writes that must be consistent use a Mongo transaction (list in `architecture.md`).
- Every endpoint: auth → tenancy → rbac → rate limit → zod validation. Errors use the standard `{ error: { code, message, details, requestId } }` shape.

## Commands

_To be filled in once scaffolding exists (dev, test, lint, seed, worker)._
