# OpsDesk
Multi-tenant support & ticketing platform: real-time chat, SLA tracking, background jobs.
Graded on correctness of isolation, real-time, jobs and SLA - not on feature count.

## Stack
- client/: React + TypeScript (Vite), Tailwind, Socket.io client
- server/: Node + Express, Socket.io, MongoDB + Mongoose (replica set), Redis, BullMQ
- Auth: JWT access + refresh tokens (stored in Redis) + Google OAuth

## Commands
- Up (Mongo replica set + Redis): `docker compose up -d`
- Client: `cd client && npm run dev` | Server: `cd server && npm run dev`
- Test: `npm test` | Lint: `npm run lint` | Typecheck (client): `npm run typecheck`
- Seed: `npm run seed` (3 orgs, all 4 roles, 1,000+ tickets; `--large` for 100k)

## Map
- server/middleware/tenancy.js - sets orgId in request context. The most critical file.
- server/services/ - business logic lives here, not in controllers
- server/services/sla.js - ALL business-hours/SLA time math
- server/sockets/ - auth.js (handshake), rooms.js (join permission checks), handlers/
- server/jobs/ - scheduled/ (cron), queued/ (producers), processors/ (workers)
- client/src/hooks/useSocket.ts + lib/socket.ts - the only place sockets are created

## Invariants (never break these)
- **Tenancy:** orgId comes only from the auth context, never from req.body/params/query.
  Every tenant-scoped model uses the tenant plugin, so queries are org-scoped automatically.
  Aggregations must start with `$match: { orgId }`. Redis cache keys must include orgId.
  Why: one missed filter leaks another org's data - that is the worst bug this app can have.
- **Sockets:** unauthenticated sockets join nothing. Join a room only after a server-side permission check.
  Internal notes go only to the agents room (`ticket:<id>:agents`), never the ticket room customers are in.
- **Ticket status:** change it only through the state machine in services. Never set `status` directly.
- **Transactions:** required for ticket merge, assignment + load counter update, org creation + owner.
  Any new multi-document write that must be all-or-nothing gets one too.
- **Side effects** (email, webhooks, reports, attachments) go through a queue, never inline in a request.
  Processors must be idempotent - retries will run them more than once. Every job payload carries orgId.
- **Time:** store UTC; convert using the org's timezone only inside sla.js.

## Conventions
- API lives under `/api/v1`. Never change a v1 response shape; breaking changes go to v2.
- Validate every request body/params/query with zod.
- Errors: `{ error: { code: "MACHINE_CODE", message, details? } }` via the central error handler.
- Logging: use the logger (JSON, carries requestId). No `console.log`.
- New filter or sort → compound index with orgId first. Check it with explain() (no COLLSCAN).

## Testing
- Every new tenant-scoped model/route gets a cross-org leak test (Org A user cannot read Org B data).
- For bugs: write a failing test that reproduces it before fixing.

## Read when relevant
- Adding/changing a socket event → docs/socket-events.md (update it in the same change)
- Touching tenancy, auth or queries → docs/tenancy-strategy.md
- New or changed endpoint → docs/api.md
- CI/CD, env vars, health checks, shutdown → docs/deployment.md

## Workflow
- Plan: `/grill-me` → `/to-spec` → `/to-tickets` (tickets in `.tickets/`, format in `docs/agents/issue-tracker.md`).
- Build: `/build-with-me` on one ticket; I write the code.
- Review: `/code-review`, then fix findings and explain each fix.
- Record agreed decisions with `decision-log` (D-NNN); specs cite IDs.
- Bug found mid-work: write a `bug` ticket directly in `.tickets/`. Domain docs: `docs/agents/domain.md`.