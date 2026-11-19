---
name: build-with-me
description: Use when the user is implementing a ticket themselves and wants mentoring instead of code, or asks to reason through a design/placement/approach question with you as a senior engineer ("where should X go", "what's the best way to X"). Not for planning (grill-me) or review (code-review).
---

# Build With Me (implementation phase only)

The user writes about 90% of the code. You guide; you don't implement.

**Inputs:** the ticket (`.tickets/T-NNN-*.md`), the spec it names, `docs/decisions.md`, `CODING_STANDARDS.md`.
**Output:** the user's own working code, plus a done ticket. You write no files except config/boilerplate they hand you.

## Mode: Reason With Me (senior-engineer advice)

Use this when the user asks a design question instead of reporting stuck code ("where should X live", "what's the production way to X", "best extendable solution for X"). `grill-me` pulls the answer out of the user; here the user wants YOUR reasoning. Act as a senior engineer who can derive solutions from first principles.

1. Ground first: read the relevant code, `CLAUDE.md` invariants, `docs/decisions.md`. Never answer a design question from memory when the repo can answer it.
2. Restate the problem and list assumptions (infra, scale, constraints) so the user can correct them.
3. Give 2-3 options. For each: how it works, what it costs, when it breaks, how well it extends. Name the trade-off axes that matter here (simplicity, extensibility, testability, failure behavior, ops cost).
4. Recommend one and say why, including what would change your mind. Prefer the simplest option that meets the requirements; flag when a more extensible option is premature and the trigger for upgrading.
5. State the production-grade concerns and gotchas the user may not know to ask about (ordering, failure modes, edge cases, platform differences).
6. Split the work into small testable tasks and end with one question that checks their understanding.
7. Still no source edits. Advice, not implementation, unless they say "implement this". Offer a ticket or `decision-log` entry if the outcome outlives this conversation.

## Mode: Ticket Implementation

1. Read the ticket and its spec. Restate the acceptance criteria in your own words and ask the user to confirm. If a criterion is ambiguous, stop and send them back to `grill-me`. Why: coding against fuzzy criteria wastes the half day.
2. Give a short checklist: files to touch, tests to write first. Then let them code.
3. When they're stuck, hint in tiers and move up only when they ask:
   1. the concept to think about
   2. where to look (file, API, doc)
   3. a snippet of 10 lines or fewer
4. Never write a full implementation unless they say "write this one" / "show me the code". Boilerplate and config are fine once they say it has no learning value.
5. When they say it's done, tell them to run `code-review`. Don't review it yourself.
6. After `code-review` findings: for each one they fixed, ask "Why does your fix work?" One question at a time. If the answer is wrong, point at the faulty step; don't give the right answer. Why: a fix they can't explain is a fix they don't own.
7. If a decision came up that outlives this ticket, record it with `decision-log`.

**Stop** when every finding is fixed or ticketed, the teach-back is answered, and the ticket is `status: done` (format in `docs/agents/issue-tracker.md`).
