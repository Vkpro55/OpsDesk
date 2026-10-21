# Decision Log (ADRs)

Append-only. To change a decision, add a new ADR that **supersedes** the old one and mark the old one `Superseded by ADR-xxx`.
Status: `Proposed` (Claude's default, awaiting user OK) · `Accepted` · `Superseded` · `Rejected`.

Template:
```
## ADR-NNN: Title
- Date: YYYY-MM-DD · Status: …
- Context: why a choice was needed
- Decision: what we chose
- Alternatives: what we didn't, and why
- Consequences: what this commits us to
```

---

## ADR-001: Stack fixed by the brief
- Date: 2026-10-15 · Status: Accepted (frontend framework superseded by ADR-015)
- Decision: Next.js (App Router) + Tailwind + socket.io-client; Node/Express + Socket.io; MongoDB replica set + Mongoose; Redis; BullMQ; JWT + refresh tokens + Google OAuth.
- Consequences: local dev needs a single-node replica set (docker-compose `--replSet rs0`); tests use `MongoMemoryReplSet`.

## ADR-002: Tenant isolation via Mongoose plugin + AsyncLocalStorage
- Date: 2026-10-15 · Status: Proposed
- Context: brief demands isolation at the query layer, not per-controller filters.
- Decision: global `tenantPlugin` injects `orgId` from ALS into every query/aggregate/write on tenant models; missing context throws. Opt-out only via explicit `skipTenant` option.
- Alternatives: per-org database (heavy ops, hard with 3+ orgs on Atlas free tier); repository wrapper (easy to bypass with raw Model calls).
- Consequences: all tenant indexes prefixed with `orgId`; cross-org tests mandatory; `skipTenant` usages are audited in `tenancy-strategy.md`.

## ADR-003: Language — server JavaScript (ESM), client TypeScript
- Date: 2026-10-15 · Status: Proposed
- Context: brief's folder tree shows `.js` server files and `.ts` client files.
- Decision: follow the brief. Server uses ESM + JSDoc where types help; client is TS.
- Alternatives: TS everywhere (stronger, but adds build step to server).

## ADR-004: Validation with zod
- Date: 2026-10-15 · Status: Proposed
- Decision: zod schemas per route in `backend/validators/`; one `validate({ body, query, params })` middleware. Same schemas reused for socket event payloads.

## ADR-005: Separate worker process
- Date: 2026-10-15 · Status: Proposed
- Decision: `backend/worker.js` runs BullMQ workers + job schedulers; API never processes jobs. Worker emits socket events via `@socket.io/redis-emitter`.
- Consequences: two deploy targets for backend; graceful shutdown implemented in both.

## ADR-006: Auth tokens
- Date: 2026-10-15 · Status: Proposed
- Decision: access JWT (15 min) held in client memory, sent as `Authorization` header and socket `auth.token`. Refresh token: opaque random, httpOnly+Secure+SameSite cookie, stored **hashed** in Redis with TTL, rotated on every use; reuse of an old token revokes the whole family. Google OAuth via `google-auth-library` (ID token verify).
- Alternatives: passport (more deps for one provider).

## ADR-007: Reconnection via per-ticket sequence + event log
- Date: 2026-10-15 · Status: Proposed
- Decision: `ticket.seq` incremented in the mutation transaction; `ticketEvents` stores each event (TTL 7d). Client rejoins with `lastSeq`, server replays filtered by visibility; gap too large → `ticket:resync_required` and client refetches.
- Alternatives: Socket.io connection-state recovery (doesn't work with redis adapter reliably and doesn't survive long outages); always refetch (simpler, but "silently diverge" risk on lists).

## ADR-008: Ticket state machine
- Date: 2026-10-15 · Status: Proposed
- Decision: transition table in `knowledge.md`, implemented as a single map in `services/ticketStateMachine.js`; illegal transition → `409 INVALID_STATUS_TRANSITION`.

## ADR-009: SLA clock pauses in `waiting_on_customer`
- Date: 2026-10-15 · Status: Proposed
- Context: industry norm; otherwise agents are penalised for customer silence.
- Decision: resolution SLA pauses while waiting on customer; first-response SLA stops at first public agent reply.
- Decision (calc): due dates are **computed and stored** (`sla.*DueAt`) at create/resume using a business-hours walker in org timezone (Luxon). Breach job queries by indexed due date instead of recomputing every ticket.

## ADR-010: Logging with pino, errors to Sentry
- Date: 2026-10-15 · Status: Proposed
- Decision: `pino` + `pino-http`; request ID from `X-Request-Id` or generated (`crypto.randomUUID`), stored in ALS, echoed in response header and error body, propagated to job data and socket handlers.

## ADR-011: Rate limiting with rate-limiter-flexible (Redis)
- Date: 2026-10-15 · Status: Proposed
- Decision: two limiters per request — `user:<id>` and `org:<id>` — with tiers: `read` (cheap), `write`, `expensive` (search, analytics, exports), `auth` (by IP). Returns `429 RATE_LIMITED` + `Retry-After`.

## ADR-012: API versioning strategy
- Date: 2026-10-15 · Status: Proposed
- Decision: URL versioning. `routes/v1/` and future `routes/v2/` mounted side by side; controllers are thin and version-specific, **services are shared**. Breaking change → new version only; v1 gets `Deprecation` + `Sunset` headers once v2 ships.

## ADR-013: Testing
- Date: 2026-10-15 · Status: Proposed
- Decision: Vitest + supertest + `MongoMemoryReplSet`; socket tests with real `socket.io-client`. Priority tests: tenancy leakage, internal-note isolation, state machine, SLA business-hours, job retry/DLQ.

## ADR-014: Job monitoring view
- Date: 2026-10-15 · Status: Proposed
- Decision: in-app owner/manager page backed by `GET /api/v1/admin/jobs` (BullMQ `getJobCounts`, failed list, retry/requeue actions). Skip Bull Board unless the custom view falls short.

## ADR-015: Frontend on Vite + React + TS instead of Next.js
- Date: 2026-10-21 · Status: Accepted
- Context: ADR-001 took Next.js App Router from the brief; user chose Vite.
- Decision: `client/` is a Vite React-TS SPA. Supersedes the frontend part of ADR-001.
- Alternatives: Next.js (the brief's stack; adds SSR/server routes we don't need since Express is the API).
- Consequences: may deviate from the brief's stated stack (grading risk accepted by user); client-side routing needs a router lib; SPA host needs a fallback to `index.html`.
