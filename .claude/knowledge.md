# Knowledge — Requirements & Domain Rules

Source of truth for *what* we're building. Original brief: "Project 3 (Hard) — OpsDesk".

## Grading rubric (prioritise by marks)

| Area | Marks | What graders look for |
|------|------:|----------------------|
| Real-time (auth, rooms, isolation, reconnection) | 20 | Unauthed socket joins nothing; customer never gets internal notes; reconnect resyncs missed events |
| Multi-tenant isolation (query layer) | 15 | Isolation enforced below controllers; tests proving Org A can't read Org B |
| Background jobs (scheduled + queued, retries, DLQ) | 15 | Backoff, dead-letter, monitoring view |
| MongoDB (transactions, indexing, aggregation, explain()) | 15 | explain() for 3 heaviest queries shows IXSCAN, no COLLSCAN |
| Production deployment (CI/CD, health, logging, graceful shutdown) | 15 | Push to main → tests → deploy; /health; JSON logs w/ request IDs; Sentry |
| SLA engine (business-hours correctness) | 10 | Fri 6 PM + 4h SLA ≠ breached Mon morning |
| API versioning & rate limiting | 5 | /api/v1, documented v2 strategy, per-user + per-org tiers |
| Code quality & architecture | 5 | |

## Roles (per organization)

| Role | Can do |
|------|--------|
| Customer | Create tickets, reply, view **own** tickets only. Never sees internal notes. |
| Agent | View/respond to assigned + unassigned tickets, change status, write internal notes |
| Manager | Agent + reassign, team analytics, configure SLA |
| Owner | Everything + billing, member management, org settings |

Role is held on the **membership** (user ↔ org), not the user. Hierarchy: owner > manager > agent > customer.

## Ticket status state machine (server-enforced)

`open` → `in_progress` → `waiting_on_customer` → `resolved` → `closed`

| From | Allowed to | Notes |
|------|-----------|-------|
| open | in_progress, resolved, closed | closed = spam / merged duplicate |
| in_progress | waiting_on_customer, resolved, open | → open on unassign |
| waiting_on_customer | in_progress, resolved, closed | customer reply auto-moves → in_progress; stale job → closed |
| resolved | open, closed | customer reply/reopen → open; auto-close job → closed |
| closed | — | terminal |

_Status: proposed (ADR-008). Change here + ADR if revised._

## Tickets

- Fields: subject, description, category, priority (P1–P4), attachments, tags, assignee, requester.
- Assignment: manual, or auto via `round_robin` / `least_loaded` (org setting).
- Threaded conversation: `public` replies + `internal` notes (agents+ only).
- Merge duplicates (source → closed, messages moved to target), link related tickets.

## Real-time features

- Live ticket updates (status, assignment, replies) for everyone viewing.
- Live chat inside a ticket; typing indicators; online presence.
- Live notifications: assigned, @mentioned in note, SLA warning approaching.
- Agent dashboard queue updates live.
- **Hard reqs:** socket auth, room isolation, reconnection resync, multi-instance design note.

## SLA rules

- Per-org policy per priority: first-response target + resolution target (e.g. P1: 1h first response).
- Time counts **only within org business hours** (org timezone, weekly schedule, holidays optional).
- Warning at 80% consumed, breach at 100%.
- Clock pauses while `waiting_on_customer` (ADR-009, proposed).
- Dashboard: compliance rate, at-risk, breached.

**Canonical test case:** Org hours Mon–Fri 09:00–17:00. Ticket at Fri 18:00, 4h SLA → due Mon 13:00. Not breached Mon 09:00.

## Background jobs

- Scheduled: SLA breach check, daily digest email, stale-ticket auto-close, analytics pre-computation.
- Queued: email notifications, attachment processing, webhook delivery, report generation.
- Exponential backoff retries; dead-letter after max attempts; monitoring view (pending/active/failed/retries).

## Search & analytics

- Full-text over subject + conversation body. Filters: status, priority, assignee, category, tags, date range, SLA status. Saved views per user.
- Must stay fast at **100,000+ tickets** — seed and prove with explain().
- Analytics: volume over time / category / priority, agent performance (resolution time, handled, CSAT), SLA trends, peak-hours heatmap. Aggregation pipelines + pre-computation + Redis cache.

## Production requirements

CI/CD (tests then deploy on push to main) · separate dev/prod envs · `/health` (db, redis, queues) · structured JSON logs w/ request ID across HTTP, sockets, jobs · Sentry · graceful shutdown (requests finish, sockets close, jobs not lost) · documented + demonstrated DB backups.

## API

`/api/v1/...` · documented v2 strategy · rate limits per-user and per-org, tiered by endpoint cost · validation on every endpoint · machine-readable error codes.

## Mongo must-haves

Transactions (merge, assign+counter, org+owner creation, …) · compound indexes for every filter combo · text index · TTL index (sessions, old notifications) · explain() for top 3 queries.

## Redis must-haves

Session/refresh token store · Socket.io adapter · aggregation cache w/ invalidation · BullMQ backing store.

## Bonus (only after core is done)

Email-to-ticket · CSAT survey · knowledge base suggestions · webhooks · canned responses/macros · CSV export via job · audit log.

## Submission checklist

- [ ] GitHub repo, CI/CD configured and passing
- [ ] README + `docs/api.md` + `docs/socket-events.md`
- [ ] `docs/tenancy-strategy.md` — exactly how cross-org leakage is prevented
- [ ] `docs/deployment.md` (incl. multi-instance socket design note, backup strategy)
- [ ] Live deployment: frontend + backend
- [ ] Seed: 3 orgs, all 4 roles, 1,000+ tickets (plus 100k perf seed)
- [ ] explain() output for 3 heaviest queries
- [ ] Demo video: real-time across 2 windows, SLA breach firing, job retrying after failure
