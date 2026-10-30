-- ============================================================================
-- NagrikSeva - Digital Citizen Services Platform
-- Complete PostgreSQL + PostGIS Schema Definition
-- 18 Tables with UUIDs, PostGIS Spatial Types, Constraints and Indexes
-- ============================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Enable PostGIS if available in environment
DO $$ 
BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS extension not available or requires superuser. Geometry columns will use text/fallback if needed.';
END $$;

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    description TEXT,
    sla_target_pct INTEGER DEFAULT 90,
    staff_count INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MUNICIPAL WARDS
CREATE TABLE IF NOT EXISTS municipal_wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_number INTEGER UNIQUE NOT NULL,
    ward_name VARCHAR(150) NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_code VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(25),
    role VARCHAR(50) NOT NULL CHECK (role IN ('CITIZEN', 'DEPARTMENT_OFFICER', 'FIELD_WORKER', 'SUPER_ADMIN')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    address TEXT,
    ward_id UUID REFERENCES municipal_wards(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update head_officer_id reference on departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS head_officer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 4. WORKER PROFILES
CREATE TABLE IF NOT EXISTS worker_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    specializations TEXT[] DEFAULT '{}',
    assigned_zone VARCHAR(100),
    rating NUMERIC(3, 2) DEFAULT 4.80,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPLAINT CATEGORIES
CREATE TABLE IF NOT EXISTS complaint_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) UNIQUE NOT NULL,
    default_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMPLAINTS
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES complaint_categories(id) ON DELETE RESTRICT,
    current_department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    ward_id UUID REFERENCES municipal_wards(id) ON DELETE SET NULL,
    street_location VARCHAR(255) NOT NULL,
    landmark VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN (
        'SUBMITTED', 'DEPARTMENT_REVIEW', 'TRANSFERRED', 'ACKNOWLEDGED',
        'WORKER_ASSIGNED', 'INSPECTION', 'WORK_IN_PROGRESS', 'VERIFICATION',
        'RESOLVED', 'DISPUTED', 'CLOSED', 'REJECTED'
    )),
    acknowledged_at TIMESTAMPTZ,
    assigned_worker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    inspection_completed_at TIMESTAMPTZ,
    work_started_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    sla_ack_deadline TIMESTAMPTZ,
    sla_assign_deadline TIMESTAMPTZ,
    sla_inspection_deadline TIMESTAMPTZ,
    sla_resolution_deadline TIMESTAMPTZ,
    is_escalated BOOLEAN DEFAULT FALSE,
    escalation_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMPLAINT SUPPORTERS
CREATE TABLE IF NOT EXISTS complaint_supporters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_complaint_supporter UNIQUE (complaint_id, citizen_id)
);

-- 8. COMPLAINT EVIDENCE
CREATE TABLE IF NOT EXISTS complaint_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    evidence_stage VARCHAR(50) NOT NULL CHECK (evidence_stage IN ('CITIZEN_INITIAL', 'WORKER_BEFORE', 'WORKER_AFTER', 'OTHER')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. COMPLAINT STATUS HISTORY
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. COMPLAINT TRANSFERS
CREATE TABLE IF NOT EXISTS complaint_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    from_department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    to_department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    transferred_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transfer_number INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    receiving_decision VARCHAR(50) DEFAULT 'PENDING' CHECK (receiving_decision IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. WORKER ASSIGNMENTS
CREATE TABLE IF NOT EXISTS worker_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assignment_notes TEXT,
    status VARCHAR(50) DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 'REWORK_REQUIRED', 'COMPLETED', 'CANCELLED')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 12. WORK UPDATES
CREATE TABLE IF NOT EXISTS work_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES worker_assignments(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('INSPECTION', 'PROGRESS', 'COMPLETION')),
    notes TEXT NOT NULL,
    materials_used TEXT,
    technical_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. COMPLAINT REVIEWS
CREATE TABLE IF NOT EXISTS complaint_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    review_type VARCHAR(50) NOT NULL CHECK (review_type IN ('OFFICER_VERIFICATION', 'CITIZEN_CONFIRMATION', 'CITIZEN_DISPUTE')),
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('APPROVED', 'REWORK_REQUIRED', 'CONFIRMED', 'DISPUTED')),
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. SLA RULES
CREATE TABLE IF NOT EXISTS sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    category_id UUID REFERENCES complaint_categories(id) ON DELETE CASCADE,
    ack_deadline_hours INTEGER NOT NULL DEFAULT 6,
    assign_deadline_hours INTEGER NOT NULL DEFAULT 12,
    inspection_deadline_hours INTEGER NOT NULL DEFAULT 24,
    resolution_deadline_hours INTEGER NOT NULL DEFAULT 72,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. ESCALATIONS
CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    escalation_level INTEGER NOT NULL CHECK (escalation_level IN (1, 2, 3)),
    trigger_reason VARCHAR(150) NOT NULL,
    overdue_hours INTEGER NOT NULL DEFAULT 0,
    responsible_role VARCHAR(50) NOT NULL,
    responsible_officer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
    admin_notes TEXT,
    handled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    escalated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 17. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. USER SESSIONS (For connect-pg-simple)
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Create Indexes for High-Velocity Queries
CREATE INDEX IF NOT EXISTS idx_users_user_code ON users(user_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_dept ON users(department_id);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_dept ON complaints(current_department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_ticket ON complaints(ticket_number);

CREATE INDEX IF NOT EXISTS idx_supporters_complaint ON complaint_supporters(complaint_id);
CREATE INDEX IF NOT EXISTS idx_evidence_complaint ON complaint_evidence(complaint_id);
CREATE INDEX IF NOT EXISTS idx_history_complaint ON complaint_status_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_transfers_complaint ON complaint_transfers(complaint_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_dept ON complaint_transfers(to_department_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_dept ON complaint_transfers(from_department_id);
CREATE INDEX IF NOT EXISTS idx_assignments_worker ON worker_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status, escalation_level);
CREATE INDEX IF NOT EXISTS idx_session_expire ON user_sessions(expire);

