# NagrikSeva Backend API

Production-structured Node.js + Express.js backend for the **NagrikSeva – Digital Citizen Services Platform**.

Connects Citizens, Department Officers, Field Workers, and Super Admins to a centralized PostgreSQL database with full civic workflow management, inter-department transfers, SLA monitoring, and analytics.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL with PostGIS extension support
- **Driver**: `pg` (Connection Pooling & Parameterized SQL Queries)
- **Session Store**: `express-session` with `connect-pg-simple` (storing sessions in `user_sessions`)
- **Authentication**: Stateful sessions via HTTP-only Cookies & `bcrypt`
- **Validation**: Zod
- **File Uploads**: Multer with Supabase Storage / Local Disk fallback
- **Cron Jobs**: `node-cron` for automated SLA breach monitoring
- **Documentation**: Swagger / OpenAPI 3.0 at `/api-docs`
- **Testing**: Vitest + Supertest

---

## 📁 Directory Structure

```text
backend/
├── database/
│   ├── schema.sql         # 18 PostgreSQL tables with constraints and indexes
│   ├── seed.sql           # Deterministic UUID seed data & bcrypt hashes
│   └── migrate.js         # Migration & seed runner script
├── docs/
│   └── API_DOCUMENTATION.md # Comprehensive endpoint specifications
├── src/
│   ├── config/
│   │   ├── database.js    # PostgreSQL pool & transaction helper
│   │   ├── session.js     # Session configuration with connect-pg-simple
│   │   ├── storage.js     # Object storage handler (Supabase / local)
│   │   └── swagger.js     # OpenAPI specification
│   ├── middlewares/
│   │   ├── authenticate.js
│   │   ├── authorizeRole.js
│   │   ├── authorizeDepartment.js
│   │   ├── validateRequest.js
│   │   ├── uploadMiddleware.js
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── modules/
│   │   ├── auth/          # Login, logout, session check, me
│   │   ├── users/         # Profile updates, worker listing, user admin
│   │   ├── departments/   # Department master & admin endpoints
│   │   ├── wards/         # Municipal ward boundaries & listings
│   │   ├── categories/    # Complaint categories & SLA baselines
│   │   ├── evidence/      # Photo/video uploads & stage tagging
│   │   ├── complaints/    # Duplicate search, filing, map pins, lifecycle
│   │   ├── transfers/     # Inter-department routing & approval queues
│   │   ├── assignments/   # Field worker tasks, inspections & completions
│   │   ├── reviews/       # Officer verification & citizen confirmation/dispute
│   │   ├── sla/           # SLA rules engine
│   │   ├── escalations/   # Escalation queue, acknowledgment & overrides
│   │   ├── notifications/ # User notifications & unread counts
│   │   ├── audit/         # Tamper-evident audit logging
│   │   └── analytics/     # Department and city-wide analytics
│   ├── jobs/
│   │   └── slaMonitor.job.js # 15-minute cron job checking SLA breaches
│   ├── routes/
│   │   └── index.js       # Route aggregator mounting under /api/v1
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── generateTicketNumber.js
│   │   └── statusTransitions.js
│   ├── app.js             # Express application configuration
│   └── server.js          # Server entry point & graceful shutdown
└── tests/                 # Vitest test suite (44 passing tests)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (v14+ with PostGIS extension)

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

Key environment variables:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5432/nagrikseva
SESSION_SECRET=your_super_secret_session_key_2026
SESSION_MAX_AGE_DAYS=7
CORS_ORIGIN=http://localhost:5173
```

### 4. Initialize Database Schema & Seed Data
```bash
npm run db:init
```
This executes `database/schema.sql` (creating all 18 tables) followed by `database/seed.sql` (populating demo departments, categories, wards, and users).

---

## 🔑 Demo Credentials (from `seed.sql`)

| Role | User Code | Email | Password |
|---|---|---|---|
| **Citizen** | `CIT001` | `citizen@example.com` | `citizen123` |
| **Department Officer** | `OFF001` | `officer@bbmp.gov.in` | `officer123` |
| **Field Worker** | `WRK001` | `worker@bbmp.gov.in` | `worker123` |
| **Super Admin** | `ADM001` | `admin@bbmp.gov.in` | `admin123` |

---

## 🏃 Running the Application

### Development Mode (with hot-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Once running:
- **API Base**: `http://localhost:5000/api/v1`
- **Health Check**: `http://localhost:5000/api/v1/health`
- **Swagger UI**: `http://localhost:5000/api-docs`

---

## 🧪 Running Tests

The test suite validates status lifecycle transitions, Zod validations, role authorization guards, and API error formatting:

```bash
npm test
```

To run in watch mode:
```bash
npm run test:watch
```

---

## 📄 License
MIT

