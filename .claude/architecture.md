# Architecture

_Living document. Reflects the **intended** design until code exists; then it must match the code._

## Runtime topology

```
 Browser (Next.js App Router, socket.io-client)
     │  HTTPS /api/v1/*            │  WSS /socket.io
     ▼                             ▼
 ┌───────────────────────────────────────────┐
 │ API process (Express + Socket.io)         │  ← N instances behind LB
 │  middleware: requestId → auth → tenancy   │
 │              → rbac → rateLimit → zod     │
 └──────┬───────────────┬────────────────────┘
        │               │ enqueue / pub-sub
        ▼               ▼
   MongoDB          Redis ───────────────┐
 (replica set)   • refresh tokens/sessions│
        ▲        • socket.io adapter      │
        │        • aggregation cache      │
        │        • BullMQ queues          │
        │                                 ▼
 ┌──────┴────────────────────────────────────┐
 │ Worker process (BullMQ workers+schedulers)│  ← same codebase, `server/worker.js`
 │  emits socket events via @socket.io/       │
 │  redis-emitter (no HTTP server)           │
 └───────────────────────────────────────────┘
```

- API and worker are **separate processes** from one codebase (ADR-005). Worker never serves HTTP.
- Worker → client events go through `@socket.io/redis-emitter`, so any API instance delivers them.

## Request context (AsyncLocalStorage)

One `AsyncLocalStorage` store per request/socket event/job: `{ requestId, orgId, userId, role }`.
Used by: tenancy plugin (orgId), logger (requestId, orgId, userId), Sentry scope.
Jobs carry `requestId` + `orgId` in job data and re-enter the context in the processor.

## Multi-tenancy (see ADR-002)

- Every tenant-scoped model has `orgId: { type: ObjectId, required: true, index: false }` (indexed via compounds) and uses `tenantPlugin`.
- `tenantPlugin` hooks: `find*`, `count*`, `update*`, `delete*`, `distinct`, `aggregate` (prepends `$match: { orgId }`), `save`/`insertMany` (sets + verifies orgId).
- No tenant context → **throw** `TENANT_CONTEXT_MISSING`. Cross-tenant system work (scheduled jobs scanning all orgs) must opt out explicitly: `Model.find().setOptions({ skipTenant: true })` — grep-able, reviewed.
- Global (non-tenant) models: `User`, `Organization`. `Membership` is tenant-scoped.
- `tenancy.js` middleware resolves orgId from the verified JWT (never from body/query/header alone) and checks membership.

## Data model (initial)

| Collection | Key fields | Tenant | Notes |
|-----------|-----------|:------:|-------|
| organizations | name, slug, settings{businessHours, timezone, holidays, slaPolicies, categories, autoAssign}, plan | — | |
| users | email, name, passwordHash?, googleId? | — | global identity |
| memberships | orgId, userId, role, status, openTicketCount | ✓ | `openTicketCount` = least-loaded counter |
| invites | orgId, email, role, tokenHash, expiresAt | ✓ | TTL on expiresAt |
| tickets | orgId, number, subject, description, status, priority, category, tags, requesterId, assigneeId, sla{firstResponseDueAt, resolutionDueAt, firstRespondedAt, resolvedAt, pausedAt, pausedMs, state}, seq, mergedInto, links[] | ✓ | `seq` = per-ticket event counter |
| messages | orgId, ticketId, authorId, body, visibility(public\|internal), mentions[], attachments[] | ✓ | |
| ticketEvents | orgId, ticketId, seq, type, payload, visibility, createdAt | ✓ | replay log for reconnection; TTL 7d |
| notifications | orgId, userId, type, data, readAt, createdAt | ✓ | TTL 30d |
| savedViews | orgId, userId, name, filters | ✓ | |
| counters | orgId, key, value | ✓ | ticket numbers, round-robin pointer |
| analyticsDaily | orgId, date, metrics… | ✓ | pre-computed by job |
| deadLetters | queue, jobId, name, data, error, attempts, failedAt | — | DLQ archive |
| auditLogs | orgId, actorId, entity, action, before, after | ✓ | bonus |

## Indexes (all tenant indexes start with `orgId`)

- tickets `{orgId, status, priority, updatedAt:-1}` — queue view
- tickets `{orgId, assigneeId, status, updatedAt:-1}` — "my tickets"
- tickets `{orgId, requesterId, createdAt:-1}` — customer view
- tickets `{orgId, "sla.state", "sla.resolutionDueAt"}` — SLA dashboard / breach job
- tickets `{orgId, category, createdAt:-1}`, `{orgId, tags, createdAt:-1}`
- tickets text `{orgId:1, subject:"text", description:"text"}` (compound text, equality on orgId)
- messages `{orgId, ticketId, createdAt}`; text `{orgId:1, body:"text"}`
- ticketEvents `{ticketId, seq}` unique; TTL on createdAt
- notifications `{orgId, userId, readAt, createdAt:-1}`; TTL on createdAt

Filter combos beyond these → verify with explain() and add/adjust; record in ADR if index set changes.

## Transactions (where consistency is required)

1. **Org signup** — create Organization + User (if new) + owner Membership + default settings/counters.
2. **Ticket assignment** — set `ticket.assigneeId` + decrement old / increment new `membership.openTicketCount` + bump round-robin pointer.
3. **Ticket merge** — move messages, close source with `mergedInto`, update target, adjust counters, write events.
4. **Status change** — ticket update + ticketEvent (seq) + counter update when leaving/entering open states.
5. **Accept invite** — create Membership + consume invite.
6. **Create ticket** — allocate ticket number (counter) + ticket + first event.

Transaction helper: `withTransaction(fn)` in `server/utils/db.js` using `session.withTransaction` (handles retries on TransientTransactionError).

## Socket.io

**Auth:** `io.use()` verifies access JWT from `handshake.auth.token`; no valid token → `next(err)`, socket never connects. Org + role loaded from membership.

**Rooms (server joins only — client never names a room it gets without an authz check):**

| Room | Members | Receives |
|------|---------|----------|
| `user:<userId>` | that user's sockets | notifications, presence of self |
| `org:<orgId>:staff` | agents/managers/owners | queue/dashboard updates, presence |
| `ticket:<ticketId>` | anyone authorized to view ticket | public replies, status, assignment, typing |
| `ticket:<ticketId>:internal` | staff authorized to view ticket | internal notes, internal typing |

- `ticket:join` handler re-runs the same `canViewTicket(user, ticket)` used by REST.
- Internal note emitted **only** to `:internal`. Payload sanitizers per audience.

**Reconnection / resync:** every ticket mutation increments `ticket.seq` and writes a `ticketEvents` doc in the same transaction. Client tracks `lastSeq` per joined ticket; on reconnect it sends `ticket:join {ticketId, lastSeq}` → server replays events `> lastSeq` filtered by visibility, or tells client to refetch if the gap exceeds TTL/limit. Dashboard/queue uses refetch-on-reconnect.

**Multi-instance:** `@socket.io/redis-adapter` for cross-instance broadcast; websocket-only transport (or sticky sessions if polling enabled); presence stored in Redis hash with per-socket keys + TTL heartbeat so it survives instance crashes. Full note → `docs/deployment.md`.

## Queues (BullMQ)

| Queue | Kind | Jobs |
|-------|------|------|
| `sla` | scheduled (every 1 min) | scan at-risk/breached, emit warnings/breaches |
| `maintenance` | scheduled | stale auto-close (hourly), analytics precompute (nightly), daily digest |
| `email` | queued | transactional emails, digests |
| `attachments` | queued | scan/thumbnail/metadata |
| `webhooks` | queued | outbound delivery |
| `reports` | queued | report / CSV export |

Defaults: `attempts: 5`, `backoff: { type: 'exponential', delay: 2000 }`. On final failure (`failed` event, `attemptsMade >= attempts`) → copy to `deadLetters` collection + `dead-letter` queue; requeue from monitoring view. Jobs must be **idempotent** (keyed by jobId).

## Folder structure

```
opsdesk/
├── client/                 # Next.js App Router, TS, Tailwind
│   ├── app/  components/  hooks/useSocket.ts  lib/socket.ts  lib/api.ts
├── server/
│   ├── app.js  server.js  worker.js  config.js
│   ├── models/  routes/v1/  controllers/  services/  validators/
│   ├── middleware/ auth.js tenancy.js rbac.js rateLimit.js validate.js error.js requestContext.js
│   ├── sockets/ auth.js rooms.js handlers/
│   ├── jobs/ scheduled/ queued/ processors/ queues.js
│   ├── services/ sla.js ticketStateMachine.js assignment.js
│   ├── utils/ aggregations/ db.js logger.js errors.js
│   ├── scripts/ seed.js explain.js
│   └── test/
├── .github/workflows/
├── docs/ api.md socket-events.md tenancy-strategy.md deployment.md explain/
└── docker-compose.yml       # mongo (rs) + redis for local dev
```
