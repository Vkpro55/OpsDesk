# OpsDesk — Claude Instructions

Multi-tenant real-time support & ticketing platform (graded project, 100 marks, 50–65h budget).
Next.js client + Express/Socket.io server + MongoDB replica set + Redis + BullMQ.

## Context files (loaded every session)

@.claude/knowledge.md
@.claude/architecture.md
@.claude/decisions.md
@.claude/coding-rules.md
@.claude/git-rules.md
@.claude/memory.md

**Default: a prompt updates NO context file.** Touch a file only when its trigger below fires.
Mechanical work — init, install, scaffold, rename, move, format, routine code — never triggers anything; git history already records it.

| File | Update only when | Never for |
|------|------------------|-----------|
| `knowledge.md` | A requirement is clarified, added, or changed | How we build it |
| `architecture.md` | System shape changes: new collection, room, queue, process, or service boundary | Package setup, file moves, folder tweaks |
| `decisions.md` | A choice between real alternatives with trade-offs (hosting, Redis provider, sync strategy) — record chosen, rejected, why | Defaults with no real alternative, obvious next steps |
| `coding-rules.md` | A new convention all future code must follow is agreed | One-off fixes |
| `git-rules.md` | A new scope or git convention is agreed | Individual commits |
| `memory.md` | Reasoning derived in chat that code/git can't show: a phase fully done, an open question raised/resolved, a direction change, something ruled out or blocked | Logging actions ("initialised X", "added file Y") |

## Session protocol

1. **Start:** read `memory.md` → "Current focus" and "Open questions" before doing anything.
2. **During:** apply the trigger table above. Never silently contradict an `Accepted` ADR — propose a superseding one and ask.
3. **After any change git would see:** end the reply with a `📦 Suggested commit` block (format in `git-rules.md`). Suggest only; don't commit unless asked.
4. **Session log:** at most one entry per working session, only if something in the `memory.md` row happened. Record reasoning, not actions.
   - ✅ "Chose Railway over Render: Render free Redis evicts keys, breaks BullMQ."
   - ❌ "Initialised backend/package.json."
5. Dates are absolute (`YYYY-MM-DD`), never "yesterday" / "last week".

## Non-negotiables (details in coding-rules.md)

- Tenant isolation lives in the **query layer** (Mongoose tenancy plugin + AsyncLocalStorage). Never rely on a controller remembering `orgId`.
- A customer socket must **never** receive an internal-note event. Internal notes go only to the `ticket:<id>:internal` room.
- Ticket status changes go through the state machine in `backend/services/ticketStateMachine.js` — never set `status` directly.
- Multi-document writes that must be consistent use a Mongo transaction (list in `architecture.md`).
- Every endpoint: auth → tenancy → rbac → rate limit → zod validation. Errors use the standard `{ error: { code, message, details, requestId } }` shape.

## Commands

_To be filled in once scaffolding exists (dev, test, lint, seed, worker)._
