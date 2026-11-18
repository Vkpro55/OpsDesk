---
name: decision-log
description: Record and recall key project decisions in a crisp docs/decisions.md. Use when a technical decision is finalized, or before answering a design question that may already have been decided.
---

# Decision Log (project memory)

`docs/decisions.md` is the project's memory. It holds **only** finalized key decisions and why they were made. It is not a progress log, a changelog or meeting notes. Keep it crisp, because it is read at the start of every session.

## Entry format (60 words max)
```markdown
## D-007 · 2026-11-16 · Auth tokens in httpOnly cookie
- **Decision**: Store JWT in httpOnly, SameSite=Lax cookie
- **Why**: Not readable by JS → XSS can't steal it; backend already sets cookies
- **Rejected**: localStorage (XSS risk), session store (extra infra)
```
Next ID = highest `D-` in the file + 1. IDs are permanent: never renumber or reuse one. Newest at the bottom.

Specs and tickets cite decisions by ID (`D-007`); they never repeat the reasoning. If you're about to copy a decision into a spec, write the ID instead.

## What qualifies
Record a decision only if it would be argued again later. That means it affects more than one task, or it chose between real alternatives: architecture, libraries, data model, API shape, auth, state management, folder structure, testing approach.

These don't qualify: task progress, bug details (those go in tickets), obvious choices, and anything the code already makes clear.

## Recording
- Record only once the user has **agreed**. Never record an option you suggested that they didn't confirm.
- Write it in the format above, at most 60 words (count before saving), and show the user the entry in one line.
- If a new decision replaces an old one, change the old heading to `## ~~D-003~~ → superseded by D-012` and shrink that entry to one line. Don't delete it.

## Recalling
Before answering any design or "why did we…" question:
```bash
grep -n -i -A3 '<keyword>' docs/decisions.md
```
- If it's found, answer with the recorded decision and reasoning, cite `D-xxx`, then ask: "Has anything changed that would reopen this?"
- Don't reargue a settled decision unless the user asks or there's a new fact. If there is a new fact, say what it is.

## Keeping it short
- Keep the file under about 150 lines. When it grows past that, compress superseded entries to one line each and merge related small decisions.
- Never paste code, logs or long explanations here.
