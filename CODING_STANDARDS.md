# Coding Standards

Goal: code that is simple, readable, extendable and scalable, in that order. When rules conflict, the earlier goal wins.
`CLAUDE.md` invariants (tenancy, sockets, state machine, transactions, queues, time) outrank this file.
Each rule is checkable against a diff. If tooling (eslint, tsc, prettier) enforces it, it is not repeated here.

## 1. Simplicity
- Solve today's requirement. No abstraction until the second real use; extract on the third. Why: a wrong abstraction costs more than duplication.
- No new dependency or pattern without a one-line reason in the PR/ticket.
- Reuse what exists (helper, schema, type, hook) before writing new. Search first.
- Delete dead code and unused exports in the same change.

## 2. Structure (extendable)
- Dependencies point inward: `route → controller → service → model`. A service never imports `req`/`res`; a controller never touches a model.
- Controllers: parse (zod) → call one service → shape the response. No business rules.
- One module = one reason to change. Group by feature (`tickets/`, `sla/`), not by file type.
- Add behaviour by adding a file/entry, not by growing a `switch`. Use a lookup map or registry once there are 3+ cases (socket handlers, job processors, status transitions).
- Cross-module calls go through the module's exported functions, never its internals. No circular imports.
- Depend on arguments, not globals: pass `orgId`, clock, and clients in, so tests need no mocks of modules.

## 3. Readability
- Functions: one job, about 30 lines max, 3 params max (else a typed object). No boolean-flag parameters; write two functions.
- Guard clauses and early returns; no `else` after `return`/`throw`; nesting depth ≤ 3.
- Name the intent: `isSlaBreached`, `hasAgentAccess`. Booleans start with `is/has/should/can`. Avoid `data`, `temp`, `handle`, `process`, `result`.
- Name complex conditions: assign a `const` before the `if`. No nested ternaries.
- Magic numbers and strings become named constants or enums, defined once.
- Comments explain why (a constraint, a trade-off, a bug it avoids), never what.

## 4. Types and validation
- `strict` on; no `any` (use `unknown` and narrow); no `as` except at a validated boundary; no `!` without a comment.
- Types derive from zod schemas (`z.infer`); one definition per contract. Request, response and DB shapes are separate types.
- Mutually exclusive states are discriminated unions, not optional-field bags.
- Validate at every boundary: HTTP, socket events, job payloads, env vars, third-party responses. Inside the boundary, trust the types.
- Explicit return types on exported functions.

## 5. Errors
- Expected failures (not found, forbidden, conflict, invalid transition) throw a typed `AppError` with a machine `code`. Unexpected ones propagate untouched.
- Throw in services; translate once in the central error handler. No `res.status(...)` in services.
- Never swallow: `catch` either handles, or adds context and rethrows (`{ cause }`). No empty catch.
- Never return error strings or `null` to signal failure when a throw fits.
- Messages for clients carry no stack, SQL/Mongo internals or secrets. Logs carry `requestId` and `orgId`, never tokens or passwords.

## 6. Scalability and data
- Every list endpoint is paginated (cursor preferred) with a hard max `limit`. No unbounded `find()`.
- No query inside a loop. Batch with `$in`, `bulkWrite` or an aggregation.
- Select only needed fields; use `.lean()` for read-only queries.
- The server is stateless: no per-user state in process memory. Shared state lives in Mongo or Redis (so a second instance or socket node works).
- Cache entries have a TTL and an invalidation path written down next to the cache call.
- Write operations that can be retried (jobs, webhooks, client retries) are idempotent. State what makes them so in a comment.
- Anything slow (>200 ms expected, or external I/O) goes to a queue (see `CLAUDE.md` side-effects rule).

## 7. React (client)
- Components render; hooks hold logic. A component over ~150 lines or with 3+ `useState` is a candidate to split.
- Server data goes through one data layer (query hook), not ad-hoc `fetch` in components. Don't copy server data into local state.
- Derive, don't sync: no `useEffect` to compute state from props/state. Use `useEffect` only for external systems (sockets, subscriptions, DOM).
- `useMemo`/`useCallback` only with a measured problem or a referential-equality need.
- Every async view handles loading, error, empty and success.
- Keep state at the lowest common parent; context only for truly app-wide values (auth, theme).
- Sockets only via `useSocket` (`CLAUDE.md`); clean up listeners on unmount.

## 8. Testing
- Test behaviour through the public interface (service function, HTTP route, hook), not private helpers or call counts.
- Arrange-act-assert, one behaviour per test, name reads as a sentence: `rejects a transition from closed to open`.
- Cover the boundary cases that hurt: empty, max, duplicate, concurrent, wrong role, wrong org.
- Tenant-scoped code gets a cross-org leak test; bug fixes get a failing test first (`CLAUDE.md`).
- Fake time and randomness; no real network or sleep in unit tests.

## 9. Change hygiene
- One concern per commit/PR; no drive-by refactors mixed with features.
- Public contract changes (API shape, socket event, job payload) update the matching doc in the same change.
- Before handing off: lint, typecheck, tests green. A red check is not "pre-existing" unless proven.
