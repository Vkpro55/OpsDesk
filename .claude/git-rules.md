# Git Commit Rules

## Claude's duty: suggest a commit after every change

After **any** change that would show up in `git status` (feature, bug fix, refactor, docs, config, tests, deps), Claude ends its reply with a ready-to-run commit suggestion:

```
📦 Suggested commit
git add <exact paths changed>
git commit -m "<type>(<scope>): <subject>" -m "<body: why + what, wrapped at 72>"
```

- Claude **suggests only** and does not run `git commit` unless the user asks.
- One logical change = one commit. If the work covered unrelated things, Claude suggests **several** commits, each with its own `git add` paths.
- `git add` lists explicit paths. Never `git add .` / `-A`, so stray files (`.env`, dumps) don't get committed by accident.
- If the change breaks the build or tests, Claude says so and doesn't suggest a commit until it's fixed. Exception: `wip:` on a feature branch, if the user wants to checkpoint.
- If the user is on `main` and the change isn't a hotfix, Claude suggests a branch first: `git switch -c feat/<name>`.

## Message format: Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Use for |
|------|---------|
| `feat` | New user-facing capability |
| `fix` | Bug fix |
| `perf` | Performance improvement (indexes, query tuning) |
| `refactor` | Code change with no behaviour change |
| `test` | Adding/fixing tests only |
| `docs` | Docs only (`docs/`, README, `.claude/`) |
| `build` | Dependencies, Dockerfile, docker-compose, package scripts |
| `ci` | GitHub Actions workflows |
| `chore` | Tooling, config, housekeeping |
| `style` | Formatting only (prettier, lint autofix) |
| `revert` | Reverting a previous commit |

### Scopes (keep to this list; add new ones here when needed)

`auth` · `tenancy` · `rbac` · `orgs` · `members` · `tickets` · `messages` · `assignment` · `sla` · `sockets` · `presence` · `notifications` · `jobs` · `search` · `analytics` · `ratelimit` · `api` · `db` · `health` · `logging` · `seed` · `client` · `ui` · `deploy` · `deps` · `context` (the `.claude/` files)

### Subject line

- Imperative mood: "add", "fix", "prevent", not "added" / "fixes".
- Lowercase after the colon, no trailing period, **≤ 72 chars** total.
- Say *what changed*, not "update file" or "fix bug".
  - ✅ `fix(sockets): stop internal notes reaching customer sockets`
  - ❌ `fix: socket bug`

### Body (required for feat/fix/perf/refactor touching logic)

- Explain **why** first, then **what**. Wrap at 72 chars.
- For fixes: the symptom, the root cause, and how the fix addresses it.
- Mention transactions, indexes, or security implications when relevant.

### Footer

- `BREAKING CHANGE: <what breaks + migration>` for API/socket contract breaks (also add `!`: `feat(api)!: ...`).
- `Refs: ADR-007` when implementing or changing a decision.
- `Closes #12` when an issue exists.

## Examples

```
feat(tenancy): enforce org isolation in mongoose query layer

Controllers previously had to remember to filter by orgId; one missed
filter would leak data across orgs. A global plugin now injects orgId
from AsyncLocalStorage into every find/update/delete/aggregate and
throws TENANT_CONTEXT_MISSING when no context is present.

Refs: ADR-002
```

```
fix(sla): exclude weekends from business-hours due date calculation

Tickets raised Friday evening were flagged as breached Monday morning
because the walker added raw hours. It now skips closed days and
starts the clock at the next opening time in the org timezone.
```

```
perf(search): add compound index for assignee + status queue filter
```

## Branches & history

- Branch names: `feat/<short-name>`, `fix/<short-name>`, `chore/…`, `docs/…`, `hotfix/…`.
- `main` is always deployable (CD deploys on push). Merge via PR once CI is green.
- Prefer **squash merge** for small feature branches. Keep separate commits when each one is meaningful on its own.
- Never force-push `main`. Rewriting your own unpushed feature branch is fine.
- Never commit secrets, `.env*` (except `.env.example`), DB dumps, `node_modules`, or build output.
