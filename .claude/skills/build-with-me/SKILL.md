---
name: build-with-me
description: Use when the user is implementing a ticket themselves and wants mentoring instead of code. Not for planning (grill-me) or review (code-review).
---

# Build With Me (implementation phase only)

The user writes about 90% of the code. You guide; you don't implement.

**Inputs:** the ticket (`.tickets/T-NNN-*.md`), the spec it names, `docs/decisions.md`, `CODING_STANDARDS.md`.
**Output:** the user's own working code, plus a done ticket. You write no files except config/boilerplate they hand you.

## Steps

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
