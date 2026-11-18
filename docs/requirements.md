# OpsDesk - Real-Time Support & Ticketing Platform

| | |
|---|---|
| **Difficulty** | ⭐⭐⭐⭐⭐ Hard (Project 3) |
| **Expected duration** | 50–65 hours |
| **Client change** | React + TypeScript (Vite) instead of Next.js |

---

## 1. Objective

Build a **multi-tenant support platform** with real-time chat, SLA tracking, background jobs and a full production deployment.

This project adds what the previous two left out: **WebSockets, background job processing, multi-tenancy, MongoDB transactions, and a real production deployment with monitoring.**

### What this project evaluates
- Real-time two-way communication at scale
- Multi-tenant data isolation
- Background job processing and scheduled work
- MongoDB transactions and advanced indexing
- Production deployment: CI/CD, logging, health checks, error tracking
- API versioning and rate limiting

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite), Tailwind CSS, Socket.io client |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB + Mongoose (**replica set**, which transactions require) |
| Cache / Queue | Redis (sessions, queues, pub/sub) |
| Jobs | BullMQ (or equivalent) |
| Auth | JWT + refresh tokens + Google OAuth |

---

## 3. Functional Requirements

### 3.1 Multi-Tenancy
- Multiple organizations use the platform. Each has its own users, tickets and settings.
- **Complete data isolation:** Org A must never see Org B's data, under any circumstances.
  - Enforce this **at the query layer**, not by filtering in controllers, where one forgotten `where` clause leaks everything.
- Organization signup creates an **owner**. The owner invites team members by email.
- Org-level settings: business hours, SLA policies, ticket categories, auto-assignment rules.

### 3.2 Roles (within an organization)

| Role | Permissions |
|---|---|
| **Customer** | Create tickets, reply, view **own tickets only** |
| **Agent** | View/respond to assigned + unassigned tickets, change status |
| **Manager** | All agent abilities + reassign, view team analytics, configure SLA |
| **Owner** | Everything + billing, member management, org settings |

### 3.3 Tickets
- Create with: subject, description, category, priority, attachments.
- **Status lifecycle:**
  ```
  Open → In Progress → Waiting on Customer → Resolved → Closed
  ```
  - Not every transition is legal. Define the allowed state machine and **enforce it server-side**.
- **Assignment:** manual, or auto-assign by round-robin or least-loaded (configurable per org).
- Threaded conversation with **internal notes**, which only agents can see and customers never see.
- Tags, merging duplicate tickets, linking related tickets.

### 3.4 Real-Time ⚡ (the core of this project)
- **Live ticket updates:** status changes, assignments and new replies appear instantly for everyone viewing the ticket, with no refresh.
- **Live chat** inside a ticket between customer and agent.
- **Typing indicators** and **online presence** per user.
- **Live notifications:** assigned a ticket, mentioned in a note, SLA breach approaching.
- **Agent dashboard** updates live as the queue changes.

#### Hard requirements
- [ ] **Socket authentication:** an unauthenticated socket connects to nothing.
- [ ] **Room isolation:** a socket only receives events for tickets it is authorized to see. **A customer must never receive an internal note event.**
- [ ] **Reconnection handling:** a dropped connection must resync the state it missed, not silently fall out of sync.
- [ ] **Multi-instance design note:** document how this behaves with multiple server instances, even if you deploy only one.

### 3.5 SLA Tracking
- Per-org SLA policies by priority (e.g. P1 first response within 1 hour).
- Track **first-response time** and **resolution time** per ticket.
- **Business-hours-aware:** a ticket raised Friday 6 PM with a 4-hour SLA is *not* breached by Monday morning if the org is closed over the weekend.
- ⚠️ **Warning at 80%** of SLA consumed. 🚨 **Breach flagged at 100%**.
- **SLA dashboard:** compliance rate, at-risk tickets, breached tickets.

### 3.6 Background Jobs (mandatory)

| Type | Jobs |
|---|---|
| **Scheduled** | SLA breach checks, daily digest emails, stale-ticket auto-close, analytics pre-computation |
| **Queued** | Email notifications, attachment processing, webhook delivery, report generation |

- Retry with **exponential backoff**.
- **Dead-letter handling** for jobs that still fail after max retries.
- **Job monitoring view:** pending, active, failed, retry counts.

### 3.7 Search & Filtering
- **Full-text search** across subject and conversation body.
- **Filters:** status, priority, assignee, category, tags, date range, SLA status.
- **Saved filter views** per user.
- Must stay fast with **100,000+ tickets**. Seed that many and prove it.

### 3.8 Analytics
- Ticket volume over time, by category, by priority.
- Agent performance: resolution time, tickets handled, satisfaction.
- SLA compliance trends.
- Peak-hours heatmap.
- All built with **aggregation pipelines**, with **pre-computation** for expensive reports.

### 3.9 Production Deployment (graded)
- [ ] **CI/CD pipeline:** tests run, then deploy on push to `main`.
- [ ] Separate **dev** and **production** environments.
- [ ] `/health` endpoint reporting database, Redis and queue status.
- [ ] **Structured JSON logging**, with request IDs carried through the whole stack.
- [ ] **Error tracking** (Sentry or equivalent).
- [ ] **Graceful shutdown:** in-flight requests complete, sockets close cleanly, no jobs are lost.
- [ ] **Database backup strategy**, documented and demonstrated.

---

## 4. Backend Requirements

### 4.1 API
- **Versioned:** `/api/v1/...`, with a documented strategy for shipping v2 without breaking v1.
- **Rate limiting:** per-user and per-org, tiered by endpoint cost.
- **Request validation** on every endpoint.
- **Consistent error responses** with machine-readable codes.

### 4.2 MongoDB
- **Transactions** wherever multi-document consistency is required. Identify these cases yourself. Known cases:
  - Ticket merge
  - Assignment + counter update
  - Org creation + owner
- **Compound indexes** supporting every filter combination.
  - Include `explain()` output for the **three heaviest queries**, proving there is no collection scan.
- **Text index** for search.
- **TTL index** for expiring data (sessions, old notifications).

### 4.3 Redis
- Session and refresh token storage.
- Socket.io adapter for pub/sub.
- Caching for expensive aggregations, **with a correct invalidation strategy**.
- Job queue backing store.

---

## 5. Folder Structure

```
opsdesk/
├── client/                      # React + TypeScript (Vite)
│   └── src/
│       ├── pages/               # route-level screens
│       ├── components/
│       ├── hooks/useSocket.ts
│       └── lib/socket.ts
├── server/
│   ├── models/
│   ├── routes/v1/
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── tenancy.js           # org isolation - the critical one
│   │   ├── rbac.js
│   │   └── rateLimit.js
│   ├── sockets/
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   └── handlers/
│   ├── jobs/
│   │   ├── scheduled/
│   │   ├── queued/
│   │   └── processors/
│   ├── services/
│   │   └── sla.js               # business-hours-aware calculation
│   └── utils/aggregations/
├── .github/workflows/           # CI/CD
├── docs/
│   ├── api.md
│   ├── socket-events.md         # every event, its payload, and who receives it
│   ├── tenancy-strategy.md      # how isolation is enforced
│   └── deployment.md
└── docker-compose.yml
```

---

## 6. Bonus Features

- [ ] Email-to-ticket (an inbound email creates a ticket)
- [ ] Customer satisfaction survey after resolution
- [ ] Knowledge base with article suggestions on ticket creation
- [ ] Webhooks for external integrations
- [ ] Canned responses / macros
- [ ] Export tickets to CSV via a background job
- [ ] Audit log of every state change

---

## 7. Evaluation Criteria

| Criteria | Marks |
|---|---:|
| Real-Time Implementation (auth, rooms, isolation, reconnection) | 20 |
| Multi-Tenant Isolation (enforced at query layer) | 15 |
| Background Jobs (scheduled + queued, retries, DLQ) | 15 |
| SLA Engine (business-hours-aware correctness) | 10 |
| MongoDB: transactions, indexing, aggregation (with `explain()`) | 15 |
| Production Deployment (CI/CD, health, logging, graceful shutdown) | 15 |
| API Versioning & Rate Limiting | 5 |
| Code Quality & Architecture | 5 |
| **Total** | **100** |

---

## 8. Submission Checklist

- [ ] GitHub repository with CI/CD configured and **passing**
- [ ] README + API docs + socket event docs
- [ ] `tenancy-strategy.md` explaining exactly how cross-org leakage is prevented
- [ ] Live deployment of **both** frontend and backend
- [ ] Seed script: 3 organizations, all four roles, 1,000+ tickets
- [ ] `explain()` output for the three heaviest queries
- [ ] Demo video showing:
  - [ ] Real-time updates across two browser windows
  - [ ] An SLA breach firing
  - [ ] A background job retrying after failure