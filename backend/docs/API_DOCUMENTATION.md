# NagrikSeva – Complete Production API Documentation
**Platform:** Digital Citizen Services Platform  
**Architecture:** Node.js (ES Modules), Express.js, PostgreSQL (`pg`), PostGIS, `express-session` (`connect-pg-simple`)  
**Base URL:** `/api/v1`  
**Interactive Swagger Docs:** `http://localhost:5000/api-docs`

---

## 1. System Overview & Architecture

The NagrikSeva API is a centralized municipal governance engine providing real-time workflow coordination across four roles:
1. **CITIZEN**: File civic complaints, explore community issues, support duplicates, track progress, dispute or confirm resolution.
2. **DEPARTMENT_OFFICER**: Review department queue, initiate inter-department transfers, assign field workers, inspect evidence, verify completed work.
3. **FIELD_WORKER**: Receive assignments, log site inspections, start remediation, submit progress logs, and upload mandatory AFTER remediation evidence.
4. **SUPER_ADMIN**: City-wide oversight, manage departments, users, categories, SLA rules, repeated transfer warnings, manual escalations, and city analytics.

### Authentication & Session Management
- **Type**: Server-side Stateful Sessions via HTTP-only Cookies.
- **Store**: `connect-pg-simple` writing directly to PostgreSQL `user_sessions` table (`nagrikseva.sid`).
- **Security**: Strict CORS protection, `httpOnly: true`, `sameSite: 'lax'`, parameterized SQL queries, password hashing via `bcrypt` (10 rounds).

### Standard Response Envelope
All API endpoints return a predictable JSON envelope:

**Success Response (HTTP 200 / 201):**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

**Error Response (HTTP 400 / 401 / 403 / 404 / 409 / 500):**
```json
{
  "success": false,
  "message": "Error description message",
  "errors": [
    "body.email: Valid email is required"
  ]
}
```

---

## 2. Complaint Status Lifecycle (12 Stages)

```
[SUBMITTED]
   │
   ├──> [DEPARTMENT_REVIEW] ──> [TRANSFERRED] (Inter-department routing)
   │           │                      │
   │           ▼                      ▼
   └──> [ACKNOWLEDGED] <──────────────┘
               │
               ▼
        [WORKER_ASSIGNED]
               │
               ├──> [INSPECTION]
               │         │
               ▼         ▼
        [WORK_IN_PROGRESS]
               │
               ▼
        [VERIFICATION] (Officer review)
          │         │
(Needs    │         ▼ (Approved)
 Rework)  └───> [RESOLVED]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
     [CLOSED]            [DISPUTED]
  (Citizen confirms)   (Level 2 Escalation)
```

---

## 3. API Endpoints Catalog

### 3.1 Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticates user credentials and creates session cookie. |
| `POST` | `/auth/logout` | Authenticated | Destroys session, deletes session record, clears cookie. |
| `GET` | `/auth/session` | Public | Checks if valid session cookie exists and returns user payload. |
| `GET` | `/auth/me` | Authenticated | Returns current authenticated user's complete profile. |

#### Request / Response: `POST /api/v1/auth/login`
```json
// POST /api/v1/auth/login
{
  "email": "officer@bbmp.gov.in",
  "password": "officer123"
}
```
```json
// Response HTTP 200
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "22222222-2222-2222-2222-222222222222",
      "email": "officer@bbmp.gov.in",
      "fullName": "Rajesh Kumar",
      "role": "DEPARTMENT_OFFICER",
      "departmentId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01",
      "departmentName": "Road Infrastructure",
      "departmentCode": "ROAD"
    }
  }
}
```

---

### 3.2 Complaints (`/api/v1/complaints`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/complaints/matches` | Public | Spatial search for existing complaints within radius (default 500m) to prevent duplicates. |
| `GET` | `/complaints` | Public / Auth | List complaints with status, category, department, ward filters. Officers default to their department. |
| `POST` | `/complaints` | Authenticated | Register new complaint. Auto-generates `ticket_number` (`BLR-YYYY-XXXX`) and sets SLA target. |
| `GET` | `/complaints/my` | Citizen | Returns complaints filed or supported by authenticated citizen. |
| `GET` | `/complaints/map` | Public | Returns spatial complaint coordinates and pins for city map view. |
| `GET` | `/complaints/:id` | Public / Auth | Detailed view including status history timeline, evidence photos, supporters, assignments. |
| `POST` | `/complaints/:id/support` | Citizen | Adds community upvote to existing complaint, incrementing `support_count`. |
| `PATCH` | `/complaints/:id/cancel` | Citizen | Cancels complaint if still in initial `SUBMITTED` status. |
| `GET` | `/complaints/stats/citizen` | Citizen | Citizen dashboard stats: total filed, active, resolved, supported. |
| `GET` | `/complaints/stats/department` | Officer / Admin | Department dashboard stats: pending assignment, in progress, pending verification, resolved, breached. |

---

### 3.3 Inter-Department Transfers (`/api/v1/transfers`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/transfers` | Officer / Admin | Initiates complaint transfer to another department with mandatory reasoning (min 10 chars). Complaint transitions to `TRANSFERRED`. |
| `GET` | `/transfers/incoming` | Officer / Admin | View complaints transferred into current department awaiting acceptance/rejection. |
| `GET` | `/transfers/outgoing` | Officer / Admin | View transfers initiated by current department. |
| `PATCH` | `/transfers/:id/review` | Officer / Admin | Target department accepts transfer (re-routing complaint) or rejects with review notes. |
| `GET` | `/transfers/repeated` | Super Admin | City-wide warning list of complaints transferred more than once. |
| `GET` | `/transfers/all` | Super Admin | Master log of all inter-department transfers across the municipal corporation. |

---

### 3.4 Worker Assignments & Execution (`/api/v1/assignments`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/assignments` | Officer / Admin | Assigns complaint to field worker. Increments worker active task count; updates status to `WORKER_ASSIGNED`. |
| `GET` | `/assignments/my-tasks` | Field Worker | Worker's prioritized task queue (active work orders, emergency first). |
| `GET` | `/assignments/:id` | Authenticated | Detailed view of assignment with instructions, work updates, and photo history. |
| `PATCH` | `/assignments/:id/accept` | Field Worker | Worker acknowledges and accepts work order. |
| `POST` | `/assignments/:id/inspection` | Field Worker | Logs site inspection notes and optional inspection photos. Transitions complaint to `INSPECTION`. |
| `PATCH` | `/assignments/:id/start` | Field Worker | Marks start of remediation on site. Transitions complaint to `WORK_IN_PROGRESS`. |
| `POST` | `/assignments/:id/progress` | Field Worker | Submits intermediate progress update with optional photos. |
| `POST` | `/assignments/:id/complete` | Field Worker | Submits work for verification. Mandatory AFTER remediation photos required. Transitions complaint to `VERIFICATION`. |

---

### 3.5 Verification & Citizen Resolution Review (`/api/v1/reviews`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/reviews/complaint/:id/officer-verify` | Officer / Admin | Officer approves remediation (`RESOLVED`) or rejects with rework instructions (`REWORK_REQUIRED`). |
| `POST` | `/reviews/complaint/:id/citizen-feedback` | Citizen | Citizen confirms issue fixed (`CLOSED` with 1-5 star rating) or disputes resolution (`DISPUTED` + Level 2 Escalation). |
| `GET` | `/reviews/complaint/:id` | Authenticated | Returns all verification decisions, ratings, and citizen feedback logs for complaint. |

---

### 3.6 SLA Rules & Escalations (`/api/v1/sla` & `/api/v1/escalations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/sla/rules` | Authenticated | List configured SLA rules by department, category, and priority. |
| `POST` | `/sla/rules` | Super Admin | Create new SLA timeline rule (acknowledgment, assignment, inspection, resolution targets). |
| `PUT` | `/sla/rules/:id` | Super Admin | Update existing SLA rule thresholds. |
| `GET` | `/escalations` | Officer / Admin | List escalated complaints (filtered by department, status, level). |
| `PATCH` | `/escalations/:id/acknowledge` | Officer / Admin | Acknowledge active escalation. |
| `PATCH` | `/escalations/:id/resolve` | Officer / Admin | Resolve escalation with mandatory resolution notes. |
| `POST` | `/escalations/manual` | Super Admin | Administrative manual intervention overriding complaint priority to Level 1, 2, or 3. |

---

### 3.7 File Storage & Evidence (`/api/v1/evidence`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/evidence/upload` | Authenticated | Multipart file upload (JPG, PNG, WebP, MP4, up to 10MB). Uploads to Supabase storage with disk fallback. |
| `GET` | `/evidence/complaint/:complaintId` | Authenticated | List all uploaded BEFORE, DURING, and AFTER evidence for complaint. |

---

### 3.8 Notifications (`/api/v1/notifications`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | Paginated notifications for authenticated user. |
| `GET` | `/notifications/unread-count` | Authenticated | Total count of unread notifications (powers UI badge). |
| `PATCH` | `/notifications/:id/read` | Authenticated | Mark specific notification as read. |
| `PATCH` | `/notifications/read-all` | Authenticated | Mark all user notifications as read. |

---

### 3.9 Analytics (`/api/v1/analytics`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/analytics/department` | Officer / Admin | Department resolution rate, average resolution hours, SLA compliance %, worker leaderboard, 6-month trends. |
| `GET` | `/analytics/city` | Super Admin | City-wide executive dashboard: total complaints, department comparison, ward performance, monthly trends. |

---

## 4. Background Scheduled Jobs

### SLA Monitoring Daemon (`src/jobs/slaMonitor.job.js`)
- **Schedule**: Runs every 15 minutes (`*/15 * * * *`).
- **Logic**:
  1. Identifies un-resolved complaints whose `sla_resolution_deadline` has passed and `is_escalated = FALSE`.
  2. Updates complaint `is_escalated = TRUE`, `escalation_level = 1`.
  3. Inserts record into `escalations` with `triggered_by = 'SLA_BREACH'`.
  4. Dispatches priority notification to Department Head and Citizen.
  5. Records system audit log entry.

