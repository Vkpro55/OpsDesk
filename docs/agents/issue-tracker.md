# Issue tracker: Local Markdown (.tickets/)

Tickets are markdown files in `.tickets/`. This file is the single source of the format.

## Conventions

- One ticket per file: `.tickets/T-NNN-slug.md`. Next ID: `ls .tickets | grep -o 'T-[0-9]*' | sort -V | tail -1`, plus 1.
- Specs: `.tickets/SPEC-<slug>.md`. Tickets cut from a spec name it in `Context`.
- Progress is the `status:` field; notes append dated under `## Notes`.
- Refer to decisions by ID (`decisions: [D-003]`), never copy their reasoning.

## Ticket format

```markdown
---
id: T-001
title: Short imperative title
type: task | bug | tech-debt | spike
status: todo | in-progress | blocked | done
priority: P1 | P2 | P3
created: YYYY-MM-DD
depends_on: []
decisions: []
---

## Context
Why this exists, 1 to 3 lines.

## Acceptance criteria
- [ ] Testable condition

## Notes
- YYYY-MM-DD: progress note
```

Bugs also get **Steps to reproduce**, **Expected**, **Actual**.

## Closing a ticket

Set `status: done` and append `- YYYY-MM-DD: Done - <one-line resolution>` under `## Notes`. Keep the file; never delete it.

## Quick bug capture

When the user reports a bug or a review finding won't be fixed now, create a `type: bug` or `tech-debt` ticket directly in this format. Say so in one line. No skill needed.

## When a skill says "publish to the issue tracker"

Create the file(s) above. Blocking edges go in `depends_on`.

## When a skill says "fetch the relevant ticket"

Read the given path or `T-NNN` id.

## Wayfinding (used by /wayfinder)

- Map: `.tickets/<effort>/map.md` (Notes / Decisions-so-far / Fog)
- Child: `.tickets/<effort>/issues/NN-<slug>.md`, with `Type:` (research/prototype/grilling/task) and `Status:` (claimed/resolved) lines
- Blocking: `Blocked by: NN, NN`; unblocked when all listed are `resolved`
- Frontier: first open, unblocked, unclaimed file by number
- Claim: set `Status: claimed` and save before working
- Resolve: append `## Answer`, set `Status: resolved`, add a gist + link to the map's Decisions-so-far
