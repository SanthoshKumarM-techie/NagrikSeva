# NagrikSeva — Digital Citizen Services Platform

A modern, responsive, enterprise-grade Gov-Tech SaaS platform designed to connect citizens with municipal departments to report civic issues, track grievance resolution milestones, and monitor municipal department accountability.

---

## 1. Project Overview

**NagrikSeva** provides an interconnected multi-role ecosystem for civic governance. It eliminates bureaucratic silos by offering end-to-end transparency: from initial citizen report filing, duplicate detection, and automated SLA tracking, to inter-departmental transfers, field crew dispatches, and citizen resolution verification.

### 4 Core Roles Supported

1. **Citizen (`CIT001`)**: Report issues with evidence, join existing neighborhood grievances, track complaint progression timelines, confirm or dispute resolution quality.
2. **Department Officer (`OFF001`)**: Review incoming departmental tickets, execute inter-departmental transfers with mandatory justification, assign specialized field crews, and verify completed works.
3. **Field Worker (`WRK001`)**: View assigned work orders, mark site inspections, upload before/after photographic proof, and submit remediation evidence for officer verification.
4. **Super Admin (`ADM001`)**: Municipal-wide oversight, department master management, identity & access control, category-specific SLA matrix configuration, 3-tier escalation monitoring, and inter-department transfer analytics.

---

## 2. Tech Stack

- **Framework:** React 19 + JSX (strictly `.jsx` components, JavaScript only)
- **Bundler & Dev Server:** Vite 8
- **Routing:** React Router DOM v7 (protected role guards, nested layouts)
- **Styling & Design Tokens:** Tailwind CSS 3.4 with custom design tokens, dark mode via CSS variables & class toggle
- **Icons:** Lucide React
- **Data Visualizations:** Recharts (pie charts, bar charts, trend lines)
- **State Management & Persistence:** React Context API + Browser `localStorage` for reactive cross-role synchronization
- **Typography:** Inter (`letter-spacing: -0.5px`)

---

## 3. Demo Login Credentials

The platform includes demo credentials and a **1-click autofill toolbar** on the login page, plus a **Quick Switch Role** menu in the top bar:

| Role | User ID | Password | Name / Department |
|---|---|---|---|
| **Citizen** | `CIT001` | `citizen123` | Aarav Sharma (Indiranagar, Ward 80) |
| **Department Officer** | `OFF001` | `officer123` | Rajesh Kulkarni (Roads & Infrastructure) |
| **Field Worker** | `WRK001` | `worker123` | Ramesh Nayak (Road Maintenance Crew Lead) |
| **Super Admin** | `ADM001` | `admin123` | Dr. Priya Sundaram (Chief Grievance Commissioner) |

---

## 4. Folder Structure

```text
Digital-Citizen-Services/
│
└── frontend/
    │
    ├── public/
    │   └── assets/
    │       └── favicon.svg
    │
    ├── src/
    │   ├── assets/
    │   │
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Button.jsx
    │   │   │   ├── Input.jsx
    │   │   │   ├── Select.jsx
    │   │   │   ├── Modal.jsx
    │   │   │   ├── Badge.jsx
    │   │   │   ├── DataTable.jsx
    │   │   │   ├── SearchBar.jsx
    │   │   │   ├── Pagination.jsx
    │   │   │   ├── ConfirmDialog.jsx
    │   │   │   ├── EmptyState.jsx
    │   │   │   └── LoadingState.jsx
    │   │   │
    │   │   ├── layout/
    │   │   │   ├── AppLayout.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── Header.jsx
    │   │   │   ├── PageHeader.jsx
    │   │   │   └── ThemeToggle.jsx
    │   │   │
    │   │   └── dashboard/
    │   │       ├── StatCard.jsx
    │   │       ├── ComplaintCard.jsx
    │   │       ├── ComplaintTimeline.jsx
    │   │       ├── ActivityFeed.jsx
    │   │       └── ChartCard.jsx
    │   │
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   └── Login.jsx
    │   │   │
    │   │   ├── citizen/
    │   │   │   ├── CitizenDashboard.jsx
    │   │   │   ├── ExploreComplaints.jsx
    │   │   │   ├── CreateComplaint.jsx
    │   │   │   ├── MyComplaints.jsx
    │   │   │   ├── ComplaintDetails.jsx
    │   │   │   ├── Notifications.jsx
    │   │   │   └── CitizenProfile.jsx
    │   │   │
    │   │   ├── officer/
    │   │   │   ├── OfficerDashboard.jsx
    │   │   │   ├── DepartmentComplaints.jsx
    │   │   │   ├── ComplaintReview.jsx
    │   │   │   ├── DepartmentTransfers.jsx
    │   │   │   ├── WorkerAssignments.jsx
    │   │   │   └── OfficerAnalytics.jsx
    │   │   │
    │   │   ├── worker/
    │   │   │   ├── WorkerDashboard.jsx
    │   │   │   ├── AssignedTasks.jsx
    │   │   │   ├── TaskDetails.jsx
    │   │   │   └── WorkerHistory.jsx
    │   │   │
    │   │   └── admin/
    │   │       ├── AdminDashboard.jsx
    │   │       ├── AllComplaints.jsx
    │   │       ├── Departments.jsx
    │   │       ├── UsersManagement.jsx
    │   │       ├── SLAConfiguration.jsx
    │   │       ├── Escalations.jsx
    │   │       ├── TransferMonitoring.jsx
    │   │       └── SystemAnalytics.jsx
    │   │
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── ComplaintContext.jsx
    │   │   ├── NotificationContext.jsx
    │   │   └── ThemeContext.jsx
    │   │
    │   ├── data/
    │   │   ├── mockUsers.js
    │   │   ├── mockComplaints.js
    │   │   ├── mockDepartments.js
    │   │   ├── mockWorkers.js
    │   │   └── mockNotifications.js
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   ├── useTheme.js
    │   │   └── useComplaints.js
    │   │
    │   ├── utils/
    │   │   ├── constants.js
    │   │   ├── statusHelpers.js
    │   │   └── storage.js
    │   │
    │   ├── styles/
    │   │   ├── globals.css
    │   │   ├── variables.css
    │   │   └── components.css
    │   │
    │   ├── App.jsx
    │   └── main.jsx
    │
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── README.md
```

---

## 5. Quick Start Instructions

Run the following commands:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (already installed)
npm install

# Start the Vite development server
npm run dev
```

The application will start immediately at:
`http://localhost:5173/`

To test production build:
```bash
npm run build
npm run preview
```

---

## 6. End-to-End Cross-Role Lifecycle Demonstration

The reactive context automatically updates state across all roles and persists to `localStorage`. You can walk through the entire grievance lifecycle:

1. **Citizen Registration & Duplicate Check:**
   - Log in as **Citizen** (`CIT001`).
   - Go to **Register Complaint**.
   - Fill in details for a pothole or water issue.
   - At Step 3 (Duplicate Check), the engine flags nearby matching complaints.
   - Choose **Endorse Existing Issue** (to join as supporter without creating duplicate ticket) or **Proceed** to generate a new complaint (`BLR-2025-XXXX`).
2. **Department Officer Intake & Transfer:**
   - Switch role to **Department Officer** (`OFF001`).
   - Open **Department Complaints** or **Action Required Queue**.
   - Review ticket, inspect citizen photographic evidence.
   - Click **Acknowledge Ticket** or click **Transfer Department** to re-route to another wing (e.g. Water Supply) with mandatory technical reasoning.
   - Original ID, evidence, supporter count, and transfer audit history are strictly preserved.
3. **Worker Assignment:**
   - Officer assigns **Ramesh Nayak** (`WRK001`) with field instructions.
   - Worker's active load increments, and citizen receives dispatch notification.
4. **Field Execution:**
   - Switch role to **Field Worker** (`WRK001`).
   - Open **Assigned Tasks** &rarr; select ticket.
   - Click **Mark Inspection Done**, then **Start Remediation Work**.
   - Attach remediation photo proof (after state) and enter completion notes.
   - Click **Submit for Officer Verification** (sets status to `Verification`).
5. **Officer Quality Verification:**
   - Switch to **Department Officer** (`OFF001`).
   - Officer reviews side-by-side before/after evidence photos and approves resolution (sets status to `Resolved`).
6. **Citizen Resolution Confirmation / Dispute:**
   - Switch back to **Citizen** (`CIT001`).
   - Open **Complaint Details**.
   - Citizen can click **Confirm & Close Case** (`Closed`) or click **Dispute Resolution** to contest inadequate repair, immediately reopening the ticket and triggering automatic **Level 2 Supervisor Escalation**.
7. **Admin Governance & SLA Monitoring:**
   - Switch to **Super Admin** (`ADM001`).
   - Open **Escalations** to inspect disputed/overdue cases.
   - Open **Transfer Monitoring** to detect multi-transferred complaints.
   - Open **SLA Configuration** to adjust statutory turnaround times.

---

## 7. Current Limitations & Scope

- **Frontend-Only Phase:** Backend API endpoints, database persistence (SQL/NoSQL), and server-side authentication are intentionally excluded.
- **Mock Persistence:** State is synchronized reactively through React Context and persisted in browser `localStorage`.
- **Media Uploads:** Photographic evidence upload simulates cloud file uploads with direct URL inputs and preset civic imagery.
- **Map:** Zonal map uses an interactive SVG grid simulation with real coordinates and popup details rather than heavy Google Maps/Mapbox API keys.
