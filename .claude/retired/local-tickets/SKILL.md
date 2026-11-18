---
name: local-tickets
description: Create, update and list Jira-style tickets stored as markdown files in the repo's .tickets/ folder. Use for tasks, bugs, tech debt and spikes the user wants to track locally.
---

# Local Tickets

Tickets live in `.tickets/` at the repo root, one markdown file per ticket. No external tools are needed.

## File naming
`.tickets/T-001-short-slug.md`. For the next ID, find the highest existing number and add 1:
```bash
ls .tickets | grep -o 'T-[0-9]*' | sort -V | tail -1
```

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
decisions: []        # e.g. [D-003] from docs/decisions.md
---

## Context
Why this exists, in 1 to 3 lines.

## Acceptance criteria
- [ ] Testable condition

## Notes
- YYYY-MM-DD: short progress note or finding
```

For bugs, also add a **Steps to reproduce** section, plus **Expected** and **Actual** lines.

## Operations
- **Create**: write the file in the format above. Keep it short. Context should explain *why*, not restate the title.
- **Update status**: edit the `status:` line and add a dated note saying what changed.
- **Close**: set `status: done` and add a final note: `- YYYY-MM-DD: Done — <one-line resolution>`. Keep the file; don't delete it.
- **List open tickets**:
  ```bash
  grep -L 'status: done' .tickets/T-*.md | xargs grep -H '^title:\|^status:\|^priority:'
  ```
  Show the result as a compact table sorted by priority, then ID.
- **What's next**: suggest the highest-priority `todo` ticket whose `depends_on` tickets are all done.

## Rules
- Turn a bug or debt into a ticket when the user says so, or when a review finds something that won't be fixed now. Mention that you created it in one line.
- Never change a ticket's acceptance criteria without telling the user.
- If a ticket's work led to a lasting decision, put the decision ID in `decisions:` and keep the reasoning in `docs/decisions.md`, not in the ticket.
