# Coding Rules

Every change must satisfy these. If a rule blocks you, raise it — don't quietly break it.

## 1. Security & tenancy (zero tolerance)

1. Tenant models use `tenantPlugin`. Never pass `orgId` from `req.body` / `req.query` into a query — the plugin supplies it from context.
2. `skipTenant: true` only in scheduled jobs that genuinely span orgs. Every use gets a `// skipTenant: <reason>` comment and is listed in `docs/tenancy-strategy.md`.
3. Authorization checks live in one place per resource (`canViewTicket`, `canEditTicket`, …) and are reused by REST **and** socket handlers.
4. Customers: queries for messages always filter `visibility: 'public'` via `messageService.listForViewer()` — no other read path for messages.
5. Never put secrets, tokens, password hashes, or full JWTs in logs, socket payloads, or error responses. Serialize models through explicit `toPublic()` / DTO functions — never send raw Mongoose docs.
6. Socket handlers validate payloads with zod and re-check authz; never trust a client-supplied `orgId`, `role`, or room name.
7. Passwords: bcrypt/argon2. Tokens stored hashed. Cookies httpOnly + Secure + SameSite.

## 2. API

1. Route chain order: `requestContext → auth → tenancy → rbac(role) → rateLimit(tier) → validate(schema) → controller`.
2. Controllers are thin: parse → call service → shape response. Business logic lives in `services/`.
3. Errors: throw `new AppError(code, httpStatus, message, details?)`; the error middleware renders
   `{ "error": { "code": "TICKET_NOT_FOUND", "message": "...", "details": {}, "requestId": "..." } }`.
   Codes are `UPPER_SNAKE`, stable, documented in `docs/api.md`. Never leak stack traces in prod.
4. Cross-tenant lookups return **404**, not 403 (don't confirm existence).
5. List endpoints are paginated (cursor-based for tickets) with a hard max page size.
6. New endpoint ⇒ update `docs/api.md` in the same change. New socket event ⇒ update `docs/socket-events.md` (event, payload, who receives it).

## 3. MongoDB

1. Multi-document invariants ⇒ `withTransaction()`. Pass `{ session }` to **every** op inside.
2. Every new query shape on a large collection needs a supporting index starting with `orgId`. Check with `explain('executionStats')` — no `COLLSCAN`.
3. Use `.lean()` for reads that don't need documents. Project only needed fields.
4. Status changes only via `ticketStateMachine.transition()`. Ticket mutations increment `seq` and write a `ticketEvent` in the same transaction.
5. Aggregations live in `utils/aggregations/`, start with `$match` on indexed fields, and are cached in Redis with explicit invalidation keys (`analytics:<orgId>:<report>`).
6. Times stored in UTC. Org timezone used only for SLA/business-hours math and display.

## 4. Real-time

1. Emit after the transaction commits, never inside it.
2. Emit to the narrowest room. Internal content → `ticket:<id>:internal` only.
3. Events are named `noun:verb` (`ticket:updated`, `message:created`, `note:created`, `typing:start`). Payloads include `ticketId` and `seq` where applicable.
4. Client code in `hooks/useSocket.ts` handles reconnect → rejoin with `lastSeq`. No component opens its own socket.

## 5. Jobs

1. Processors are idempotent (deterministic `jobId`, check-before-write).
2. Job data is small and serializable: IDs, not documents. Always include `orgId` and `requestId`.
3. Default retry policy from `jobs/queues.js`; override only with a reason.
4. Never swallow errors in processors — throw so BullMQ retries; final failures land in the DLQ.

## 6. Code style

1. Server: ESM (`import`), async/await, no callbacks. Client: TS strict, App Router conventions, Tailwind only (no CSS-in-JS).
2. Small focused modules; no premature abstractions (no interfaces/factories with one implementation).
3. Names: files `camelCase.js`, React components `PascalCase.tsx`, constants `UPPER_SNAKE`, Mongo fields `camelCase`.
4. Config only from `backend/config.js` (validated with zod at boot — fail fast on missing env). No `process.env` elsewhere.
5. Log with the context logger (`logger.info({ ticketId }, 'msg')`), never `console.log`.
6. Prettier + ESLint must pass. No commented-out code; deliberate shortcuts get a `ponytail:` comment naming the limit and upgrade path.
7. Prefer stdlib/native and already-installed deps before adding a package. A new dependency needs a one-line justification (in the PR or ADR).

## 7. Testing

1. Any change touching tenancy, authz, sockets, state machine, SLA, or jobs ships with a test.
2. Each new tenant model gets a cross-org leakage test (Org B user cannot read/update/delete Org A doc).
3. Tests are hermetic (in-memory replica set, fresh Redis DB/mock); no reliance on seed data.
4. CI must be green before merge to main.

## 8. Git

See `git-rules.md`. After every change, Claude suggests the commit.
