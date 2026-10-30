# NagrikSeva — Frontend-Backend Integration Mapping Document

**Version:** 1.0.0  
**Generated:** October 30, 2026  
**Target Environment:** Node.js (Express) + PostgreSQL (Supabase Pooler) + React 19 (Vite)

---

## 1. Global Integration Architecture

### 1.1 Base URL & Environment Configuration
- **API Base URL:** `http://localhost:5000/api/v1` (configurable via `VITE_API_BASE_URL`)
- **Credentials:** Every request to protected endpoints must include credentials (`credentials: 'include'` in native `fetch`, or `withCredentials: true` in `axios`).
- **Session Cookie:** `nagrikseva.sid` (HTTP-only, `SameSite=Lax`, 7-day TTL).

### 1.2 Standard API Response Envelopes
All backend endpoints return standardized JSON payloads:

#### Success Envelope
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

#### Error Envelope
```json
{
  "success": false,
  "message": "Validation failed / Unauthorized / Conflict",
  "errors": ["Optional list of specific field validation errors"]
}
```

### 1.3 Universal Data Transformations
Frontend screens must handle these standardized transformations between client UI and backend database:

| Field Domain | Backend Data Model | Frontend UI Requirement | Transformation Rule |
|---|---|---|---|
| **Complaint Status** | Screaming Snake Case (e.g. `WORK_IN_PROGRESS`, `SUBMITTED`, `VERIFICATION`) | Title Case / Spaced (e.g. `"Work in Progress"`, `"Submitted"`) | `COMPLAINT_STATUS_MAP[status] \|\| status` |
| **Priority** | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `Low`, `Medium`, `High`, `Critical` | `capitalize(priority)` |
| **Geographic Coordinates** | `latitude: number`, `longitude: number` | `{ lat: number, lng: number }` | `{ lat: c.latitude, lng: c.longitude }` |
| **User Role** | `CITIZEN`, `DEPARTMENT_OFFICER`, `FIELD_WORKER`, `SUPER_ADMIN` | Display titles (`Citizen`, `Department Officer`, etc.) | `ROLE_DISPLAY_MAP[role]` |
| **Timestamps** | ISO 8601 UTC string (`2026-10-30T10:15:00.000Z`) | Formatted date or relative time (`"2 hours ago"`) | Pass to `timeAgo(ts)` or `new Date(ts).toLocaleDateString()` |

---

## 2. Authentication & Session Screens

### Screen 1: Sign In / Portal Gateway
- **File:** `frontend/src/pages/auth/Login.jsx`
- **Route:** `/login`
- **User Roles:** All roles (Public)
- **API Endpoints:**
  - `POST /api/v1/auth/login`
- **HTTP Method:** `POST`
- **Request Payload:**
  ```json
  {
    "email": "citizen@example.com", // OR "userId": "CIT001" / "userCode": "CIT001"
    "password": "citizen123"
  }
  ```
- **Response Fields:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "uuid",
        "email": "citizen@example.com",
        "fullName": "Aarav Sharma",
        "phoneNumber": "+91 98765 43210",
        "role": "CITIZEN",
        "departmentId": null,
        "departmentName": null,
        "departmentCode": null,
        "workerProfileId": null,
        "specialization": null,
        "avatarUrl": null
      }
    }
  }
  ```
- **Authentication:** Public; establishes `nagrikseva.sid` session cookie.
- **Frontend Transformations:**
  - Map `user.role` (`CITIZEN` $\rightarrow$ `/citizen`, `DEPARTMENT_OFFICER` $\rightarrow$ `/officer`, `FIELD_WORKER` $\rightarrow$ `/worker`, `SUPER_ADMIN` $\rightarrow$ `/admin`).
  - Store active user details in `AuthContext` state.
- **States:**
  - *Loading:* Disable submit button, render spinner with text `"Authenticating..."`.
  - *Error:* Banner alert showing `res.message` or `res.errors[0]` (e.g., `"Invalid email or password"`).

---

## 3. Citizen Portal Screens

### Screen 2: Citizen Dashboard
- **File:** `frontend/src/pages/citizen/CitizenDashboard.jsx`
- **Route:** `/citizen`
- **User Role:** `CITIZEN`
- **API Endpoints:**
  - `GET /api/v1/complaints/stats/citizen` (Citizen metric counters)
  - `GET /api/v1/complaints/my?limit=5` (Recent complaints)
  - `GET /api/v1/notifications?limit=4` (Recent notifications)
- **Response Fields:**
  - `stats`: `{ totalComplaints, pendingCount, inProgressCount, resolvedCount }`
  - `complaints`: Array of complaint objects with `id`, `ticketNumber`, `title`, `currentStatus`, `createdAt`, `latitude`, `longitude`.
- **Frontend Transformations:**
  - Transform `currentStatus` into status badge colors and chart wedges.
- **States:**
  - *Loading:* Skeleton cards for stats and list.
  - *Empty:* If `totalComplaints === 0`, display `"No complaints submitted yet. Report an issue to get started."` with a primary CTA button navigating to `/citizen/create`.

---

### Screen 3: Explore Nearby Complaints
- **File:** `frontend/src/pages/citizen/ExploreComplaints.jsx`
- **Route:** `/citizen/explore`
- **User Role:** `CITIZEN`
- **API Endpoints:**
  - `GET /api/v1/complaints/map` (Geospatial complaints across city)
  - `GET /api/v1/complaints?limit=50` (List view with filters)
  - `POST /api/v1/complaints/:id/support` (Endorse existing complaint)
- **Request Parameters / Payloads:**
  - Query params: `?categoryId=&wardId=&status=&search=`
  - Support POST: No body required; user identified by session.
- **Response Fields:**
  - Array of complaints with `id`, `ticket_number`, `title`, `description`, `latitude`, `longitude`, `support_count`, `category_name`, `status`.
- **Frontend Transformations:**
  - Group coordinates into map marker clusters `{ lat: c.latitude, lng: c.longitude }`.
  - Optimistically increment `support_count` upon clicking "Support This Issue".
- **States:**
  - *Empty:* `"No civic issues found matching the selected filters or search terms."`

---

### Screen 4: Report Civic Grievance (Create Complaint)
- **File:** `frontend/src/pages/citizen/CreateComplaint.jsx`
- **Route:** `/citizen/create`
- **User Role:** `CITIZEN`
- **API Endpoints:**
  - `GET /api/v1/categories` (Category dropdown options)
  - `GET /api/v1/departments` (Department reference list)
  - `GET /api/v1/wards` (Municipal ward selection list)
  - `POST /api/v1/complaints/matches` (Duplicate / nearby detection)
  - `POST /api/v1/evidence/upload` (Photo / file upload with Multer)
  - `POST /api/v1/complaints` (Final complaint submission)
- **Submission Payload (`POST /api/v1/complaints`):**
  ```json
  {
    "title": "Severe pothole causing vehicle damage",
    "description": "Large 2-foot pothole on main carriageway near signal.",
    "categoryId": "uuid",
    "departmentId": "uuid",
    "wardId": "uuid",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "address": "100 Feet Rd, HAL 2nd Stage, Indiranagar",
    "landmark": "Near BDA Complex",
    "priority": "HIGH",
    "evidenceUrls": ["https://storage.url/file.jpg"]
  }
  ```
- **Frontend Transformations:**
  - Format browser Geolocation API (`navigator.geolocation`) into numeric `latitude` / `longitude`.
  - When nearby duplicates are returned from `/matches`, show the comparison dialog giving the citizen the option to **"Support Existing"** instead of filing a duplicate.
- **States:**
  - *Submitting:* Upload progress bar followed by disabled submit button.
  - *Success:* Redirect to `/citizen/complaints/:id` with success toast.

---

### Screen 5: My Reported Complaints
- **File:** `frontend/src/pages/citizen/MyComplaints.jsx`
- **Route:** `/citizen/my-complaints`
- **User Role:** `CITIZEN`
- **API Endpoints:**
  - `GET /api/v1/complaints/my`
- **Query Filters:** `?status=&search=&sortBy=created_at&sortOrder=DESC`
- **Response Fields:**
  - `complaints`: Array of user's filed complaints + complaints where citizen is a supporter.
- **States:**
  - *Empty:* Graphic banner prompting citizen to lodge their first grievance.

---

### Screen 6: Complaint Details & Timeline Tracking
- **File:** `frontend/src/pages/citizen/ComplaintDetails.jsx`
- **Route:** `/citizen/complaints/:id`
- **User Role:** `CITIZEN` (also viewable by Officer, Worker, Admin)
- **API Endpoints:**
  - `GET /api/v1/complaints/:id` (Full complaint details + status history + evidence + transfers)
  - `POST /api/v1/complaints/:id/support` (Endorse)
  - `PATCH /api/v1/complaints/:id/cancel` (Withdraw complaint)
  - `POST /api/v1/reviews/complaint/:id/citizen-feedback` (Confirm or dispute resolution)
- **Feedback Request Payload (`POST citizen-feedback`):**
  ```json
  {
    "decision": "CONFIRMED", // OR "DISPUTED"
    "rating": 5,
    "feedback": "Pothole completely patched and surface leveled smoothly." // Min 10 chars if DISPUTED
  }
  ```
- **States:**
  - *Resolved Status:* Display action banner: **"Resolution Under Citizen Review"** with **[Confirm Resolution]** and **[Dispute / Re-open]** buttons.

---

### Screen 7: Citizen Notifications
- **File:** `frontend/src/pages/citizen/Notifications.jsx`
- **Route:** `/citizen/notifications`
- **User Role:** All authenticated roles
- **API Endpoints:**
  - `GET /api/v1/notifications`
  - `PATCH /api/v1/notifications/:id/read`
  - `PATCH /api/v1/notifications/read-all`
- **Response Fields:** Array of `{ id, title, message, notificationType, isRead, createdAt, complaintId }`.

---

### Screen 8: Citizen Profile
- **File:** `frontend/src/pages/citizen/CitizenProfile.jsx`
- **Route:** `/citizen/profile`
- **User Role:** All authenticated roles
- **API Endpoints:**
  - `GET /api/v1/auth/me`
  - `PATCH /api/v1/users/profile` (`{ fullName, phone, address }`)
  - `POST /api/v1/auth/logout`

---

## 4. Department Officer Portal Screens

### Screen 9: Officer Dashboard
- **File:** `frontend/src/pages/officer/OfficerDashboard.jsx`
- **Route:** `/officer`
- **User Role:** `DEPARTMENT_OFFICER`
- **API Endpoints:**
  - `GET /api/v1/complaints/stats/department`
  - `GET /api/v1/complaints?status=SUBMITTED&limit=5` (Action queue)
  - `GET /api/v1/transfers/incoming?status=PENDING` (Pending incoming transfers)
  - `GET /api/v1/escalations?status=OPEN` (Active department escalations)
- **Frontend Transformations:**
  - Calculate pending response time vs department SLA targets.

---

### Screen 10: Department Complaints Queue
- **File:** `frontend/src/pages/officer/DepartmentComplaints.jsx`
- **Route:** `/officer/complaints`
- **User Role:** `DEPARTMENT_OFFICER`
- **API Endpoints:**
  - `GET /api/v1/complaints` (Filtered to officer's department automatically)
  - Filter params: `?status=SUBMITTED,ACKNOWLEDGED,WORKER_ASSIGNED,WORK_IN_PROGRESS,VERIFICATION&priority=&wardId=`
- **States:**
  - Tabbed filters: All, New (SUBMITTED), In Progress, Verification Pending, Resolved.

---

### Screen 11: Officer Complaint Review & Action Center
- **File:** `frontend/src/pages/officer/ComplaintReview.jsx`
- **Route:** `/officer/complaints/:id`
- **User Role:** `DEPARTMENT_OFFICER`
- **API Endpoints:**
  - `GET /api/v1/complaints/:id`
  - `GET /api/v1/users/workers` (Available field workers for assignment)
  - `POST /api/v1/assignments` (Assign worker)
  - `POST /api/v1/transfers` (Initiate inter-department transfer)
  - `POST /api/v1/reviews/complaint/:id/officer-verify` (Approve resolution or reject for rework)
- **Officer Verify Payload:**
  ```json
  {
    "decision": "APPROVED", // OR "REWORK_REQUIRED"
    "reviewNotes": "Inspection verified on-site. Bitumen layer compacted to standard.",
    "reworkInstructions": "Additional sealant required on outer edge" // Required if REWORK_REQUIRED
  }
  ```

---

### Screen 12: Inter-Department Transfers Queue
- **File:** `frontend/src/pages/officer/DepartmentTransfers.jsx`
- **Route:** `/officer/transfers`
- **User Role:** `DEPARTMENT_OFFICER`
- **API Endpoints:**
  - `GET /api/v1/transfers/incoming` (Transfers awaiting acceptance)
  - `GET /api/v1/transfers/outgoing` (Transfers sent to other departments)
  - `PATCH /api/v1/transfers/:id/review` (Accept or Reject transfer)
- **Transfer Review Payload:**
  ```json
  {
    "decision": "ACCEPTED", // OR "REJECTED"
    "reviewNotes": "Jurisdiction confirmed within our ward stormwater division."
  }
  ```

---

### Screen 13: Field Worker Task Allocation
- **File:** `frontend/src/pages/officer/WorkerAssignments.jsx`
- **Route:** `/officer/assignments`
- **User Role:** `DEPARTMENT_OFFICER`
- **API Endpoints:**
  - `GET /api/v1/users/workers` (List of workers with workload and rating)
  - `GET /api/v1/complaints?status=ACKNOWLEDGED` (Complaints awaiting worker allocation)
  - `POST /api/v1/assignments`
- **Assignment Payload:**
  ```json
  {
    "complaintId": "uuid",
    "workerId": "uuid",
    "assignmentNotes": "Inspect surface drainage before laying asphalt."
  }
  ```

---

### Screen 14: Department Analytics & Performance
- **File:** `frontend/src/pages/officer/OfficerAnalytics.jsx`
- **Route:** `/officer/analytics`
- **User Role:** `DEPARTMENT_OFFICER`
- **API Endpoints:**
  - `GET /api/v1/analytics/department`
- **Response Fields:**
  - `statusBreakdown`: Counts per complaint status.
  - `categoryBreakdown`: Volume by category.
  - `avgResolutionHours`: Float average time to resolve.
  - `slaComplianceRate`: Percentage (0-100).
  - `workerLeaderboard`: Top workers with rating and completed task count.
  - `monthlyTrend`: Array of `{ month: '2026-10', count: 42 }`.

---

## 5. Field Worker Portal Screens

### Screen 15: Field Worker Dashboard
- **File:** `frontend/src/pages/worker/WorkerDashboard.jsx`
- **Route:** `/worker`
- **User Role:** `FIELD_WORKER`
- **API Endpoints:**
  - `GET /api/v1/assignments/my-tasks`
  - `GET /api/v1/notifications?limit=4`
- **Summary Counters Derived from `my-tasks`:**
  - Active tasks, Pending inspection, Submitted for verification, Completed tasks.

---

### Screen 16: Assigned Field Tasks
- **File:** `frontend/src/pages/worker/AssignedTasks.jsx`
- **Route:** `/worker/tasks`
- **User Role:** `FIELD_WORKER`
- **API Endpoints:**
  - `GET /api/v1/assignments/my-tasks`
- **Filter Tabs:** All Tasks, Assigned (New), In Progress, Verification Submitted.

---

### Screen 17: Task Execution & Site Evidence Submission
- **File:** `frontend/src/pages/worker/TaskDetails.jsx`
- **Route:** `/worker/tasks/:id`
- **User Role:** `FIELD_WORKER`
- **API Endpoints:**
  - `GET /api/v1/assignments/:id`
  - `PATCH /api/v1/assignments/:id/accept` (Worker acknowledges assignment)
  - `POST /api/v1/assignments/:id/inspection` (Log site inspection report)
  - `PATCH /api/v1/assignments/:id/start` (Begin remediation work)
  - `POST /api/v1/assignments/:id/progress` (Post progress update with photos)
  - `POST /api/v1/evidence/upload` (Upload site photos)
  - `POST /api/v1/assignments/:id/complete` (Submit completed remediation for verification)
- **Work Completion Payload:**
  ```json
  {
    "completionNotes": "Filled pothole with cold mix asphalt and compacted to grade.",
    "materialsUsed": "Cold mix asphalt (120kg), tack coat emulsion (10L)",
    "technicalDetails": "Compacted with vibratory plate tamper",
    "afterEvidenceUrls": ["https://storage.url/after_photo1.jpg"]
  }
  ```

---

### Screen 18: Completed Work History & Ratings
- **File:** `frontend/src/pages/worker/WorkerHistory.jsx`
- **Route:** `/worker/history`
- **User Role:** `FIELD_WORKER`
- **API Endpoints:**
  - `GET /api/v1/assignments/my-tasks?status=COMPLETED`
- **Displays:** Historical completed assignments with citizen review rating and officer comments.

---

## 6. Super Admin Portal Screens

### Screen 19: Central Admin Command Dashboard
- **File:** `frontend/src/pages/admin/AdminDashboard.jsx`
- **Route:** `/admin`
- **User Role:** `SUPER_ADMIN`
- **API Endpoints:**
  - `GET /api/v1/analytics/city` (City overview summary metrics)
  - `GET /api/v1/escalations?status=OPEN`
  - `GET /api/v1/transfers/repeated` (Transfers bouncing between departments)
  - `GET /api/v1/departments`

---

### Screen 20: All Civic Grievances (City-Wide Search)
- **File:** `frontend/src/pages/admin/AllComplaints.jsx`
- **Route:** `/admin/complaints`
- **User Role:** `SUPER_ADMIN`
- **API Endpoints:**
  - `GET /api/v1/complaints` (No department restriction)
  - Supports search by ticket number, citizen phone, category, ward, and department.

---

### Screen 21: Municipal Departments Management
- **File:** `frontend/src/pages/admin/Departments.jsx`
- **Route:** `/admin/departments`
- **User Role:** `SUPER_ADMIN`
- **API Endpoints:**
  - `GET /api/v1/departments`
  - `POST /api/v1/departments` (Add new department)
  - `PUT /api/v1/departments/:id` (Update contact details, nodal officer)
  - `PATCH /api/v1/departments/:id/status` (Activate/Deactivate)

---

### Screen 22: Users & Staff Management
- **File:** `frontend/src/pages/admin/UsersManagement.jsx`
- **Route:** `/admin/users`
- **User Role:** `SUPER_ADMIN`
- **API Endpoints:**
  - `GET /api/v1/users?role=&departmentId=&search=`
  - `POST /api/v1/users` (Provision officer or worker)
  - `PATCH /api/v1/users/:id/status` (Toggle active/inactive status)

---

### Screen 23: SLA Configuration Matrix
- **File:** `frontend/src/pages/admin/SLAConfiguration.jsx`
- **Route:** `/admin/sla`
- **User Role:** `SUPER_ADMIN`
- **API Endpoints:**
  - `GET /api/v1/sla/rules`
  - `POST /api/v1/sla/rules`
  - `PUT /api/v1/sla/rules/:id`
- **Update SLA Payload:**
  ```json
  {
    "acknowledgementHours": 4,
    "assignmentHours": 12,
    "inspectionHours": 24,
    "resolutionHours": 48,
    "isActive": true
  }
  ```

---

### Screen 24: Escalations & Bottlenecks
- **File:** `frontend/src/pages/admin/Escalations.jsx`
- **Route:** `/admin/escalations`
- **User Role:** `SUPER_ADMIN`
- **API Endpoints:**
  - `GET /api/v1/escalations`
  - `PATCH /api/v1/escalations/:id/acknowledge`
  - `PATCH /api/v1/escalations/:id/resolve`
  - `POST /api/v1/escalations/manual` (Administrative escalation)

---

### Screen 25: Inter-Department Transfer Monitoring
- **File:** `frontend/src/pages/admin/TransferMonitoring.jsx`
- **Route:** `/admin/transfers`
- **User Role:** `SUPER_ADMIN`
- **API Endpoints:**
  - `GET /api/v1/transfers/all`
  - `GET /api/v1/transfers/repeated` (Flags complaints transferred $\ge 2$ times)

---

### Screen 26: Municipal System Analytics & Reports
- **File:** `frontend/src/pages/admin/SystemAnalytics.jsx`
- **Route:** `/admin/analytics`
- **User Role:** `SUPER_ADMIN`
- **API Endpoints:**
  - `GET /api/v1/analytics/city`
- **Visualizations:**
  - Cross-department resolution performance table.
  - Ward-by-ward grievance volume heatmap data.
  - Monthly grievance ingestion vs resolution trends.

---

## 7. Recommended API Client Architecture for Frontend

To eliminate boilerplate across screens and prevent duplicate fetch code, create a single lightweight HTTP utility `frontend/src/utils/apiClient.js`:

```javascript
// Recommended apiClient contract
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  } else if (options.body instanceof FormData) {
    delete config.headers['Content-Type']; // Let browser set boundary
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data.data;
}
```

