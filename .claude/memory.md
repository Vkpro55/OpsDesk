# Project Memory

Running state of the project across chats. **Update at the end of every session.**

## Current focus

Project setup — Claude context files created. Next: confirm proposed ADRs, then scaffold repo.

## Next steps

1. User reviews `Proposed` ADRs in `decisions.md` → mark Accepted/Rejected.
2. Resolve open questions below (hosting especially — affects Redis/BullMQ choice).
3. `git init`, monorepo skeleton, docker-compose (Mongo rs0 + Redis), config + logger + health.
4. Tenancy plugin + leakage tests (do this before any feature model).

## Open questions

- [ ] Hosting: frontend (Vercel?), backend API + worker (Render / Railway / Fly.io?), MongoDB Atlas, Redis provider. Note: BullMQ needs Redis with `maxmemory-policy noeviction`; Upstash serverless pricing is per-command and BullMQ polls — check before choosing.
- [ ] Email provider for notifications/invites (Resend / SES / Mailtrap for dev?).
- [ ] Attachment storage (S3 / Cloudinary / R2?).
- [ ] Billing for Owner role — real (Stripe test mode) or a stub plan field?
- [ ] Which bonus features, if any.

## Progress

Phases (ordered by risk × marks):

- [x] 0. Claude context files
- [ ] 1. Skeleton: monorepo, docker-compose, config, logger, request IDs, error format, /health, CI running tests
- [ ] 2. Auth: signup (org + owner txn), login, refresh rotation, Google OAuth, invites
- [ ] 3. Tenancy plugin + RBAC + cross-org tests + `docs/tenancy-strategy.md`
- [ ] 4. Tickets: CRUD, state machine, messages/internal notes, assignment (txn + auto-assign), tags, merge, links
- [ ] 5. Sockets: auth, rooms, ticket events w/ seq, typing, presence, notifications, reconnect resync, `docs/socket-events.md`
- [ ] 6. SLA engine (business hours) + tests, breach job, dashboard
- [ ] 7. Jobs: queues, retries, DLQ, schedulers, monitoring view
- [ ] 8. Search & filters, saved views, 100k seed, explain() ×3
- [ ] 9. Analytics aggregations, pre-compute, Redis cache + invalidation
- [ ] 10. Rate limiting tiers, v2 strategy doc
- [ ] 11. Prod deploy: envs, CD, Sentry, graceful shutdown, backups demo, `docs/deployment.md`
- [ ] 12. Frontend polish, README, demo video
- [ ] 13. Bonus features

## Session log

Newest first. Format: `### YYYY-MM-DD — topic` then bullets (done / decided / blocked).

### 2026-10-15 — Git commit rules
- Added `.claude/git-rules.md` (Conventional Commits, scope list, branching).
- Agreed: Claude ends every change with a suggested commit; user runs it.

### 2026-10-15 — Project kickoff
- Received full brief (Project 3 Hard, OpsDesk). Captured in `knowledge.md`.
- Created `CLAUDE.md` + `.claude/{knowledge,architecture,decisions,coding-rules,memory}.md`.
- Drafted ADR-001…014 (001 Accepted; rest Proposed, awaiting review).
- Repo is empty, not yet a git repo.
