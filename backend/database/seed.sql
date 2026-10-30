-- ============================================================================
-- NagrikSeva Seed Data (Consistent Deterministic UUIDs and Realistic Civic Data)
-- ============================================================================

-- 1. DEPARTMENTS
INSERT INTO departments (id, name, code, email, phone, address, description, sla_target_pct, staff_count, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Roads & Infrastructure', 'RDS', 'roads.infra@bbmp.gov.in', '+91 80 2266 0001', 'Annex Building 3, BBMP Head Office, Bengaluru', 'Maintenance of arterial roads, asphalt patching, pothole repairs, footpath paving, and flyover upkeep.', 92, 34, TRUE),
  ('11111111-1111-1111-1111-111111111102', 'Water Supply', 'WTR', 'water.grievance@bwssb.gov.in', '+91 80 2294 5100', 'Cauvery Bhavan, KG Road, Bengaluru', 'Potable water pipelines, valve operations, leakage arrests, water quality monitoring, and borewells.', 95, 28, TRUE),
  ('11111111-1111-1111-1111-111111111103', 'Sanitation & Solid Waste', 'SAN', 'swm.ops@bbmp.gov.in', '+91 80 2266 0003', 'SWM Control Centre, Hudson Circle, Bengaluru', 'Door-to-door garbage collection, black spot clearing, community bins, dry waste collection centres.', 88, 52, TRUE),
  ('11111111-1111-1111-1111-111111111104', 'Street Lighting', 'LGT', 'lighting@bescom.gov.in', '+91 80 2294 3000', 'BESCOM Head Office, KR Circle, Bengaluru', 'LED street lamp repairs, underground cabling, timer synchronizations, and mast light installations.', 94, 19, TRUE),
  ('11111111-1111-1111-1111-111111111105', 'Drainage & Sewage', 'DRN', 'stormwater@bbmp.gov.in', '+91 80 2266 0005', 'SWD Wing, Multi-storeyed Building, Bengaluru', 'Stormwater drain desilting, culvert clearing, manhole cover replacement, and flood prevention.', 85, 25, TRUE),
  ('11111111-1111-1111-1111-111111111106', 'Public Health', 'HLT', 'publichealth@bbmp.gov.in', '+91 80 2266 0006', 'Health Directorate, Dasappa Hospital Compound, Bengaluru', 'Vector-borne disease control, fogging, animal birth control, stray dog management, and hygiene audits.', 90, 18, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. MUNICIPAL WARDS
INSERT INTO municipal_wards (id, ward_number, ward_name, zone_name, latitude, longitude)
VALUES
  ('22222222-2222-2222-2222-222222222201', 80, 'Hoysala Nagar (Indiranagar)', 'East Zone', 12.9719, 77.6412),
  ('22222222-2222-2222-2222-222222222202', 151, 'Koramangala', 'South Zone', 12.9345, 77.6253),
  ('22222222-2222-2222-2222-222222222203', 174, 'HSR Layout', 'South Zone', 12.9116, 77.6389),
  ('22222222-2222-2222-2222-222222222204', 153, 'Jayanagar', 'South Zone', 12.9299, 77.5824),
  ('22222222-2222-2222-2222-222222222205', 84, 'Hagadur (Whitefield)', 'Mahadevapura Zone', 12.9698, 77.7499),
  ('22222222-2222-2222-2222-222222222206', 45, 'Malleshwaram', 'West Zone', 13.0033, 77.5701),
  ('22222222-2222-2222-2222-222222222207', 176, 'BTM Layout', 'South Zone', 12.9166, 77.6101),
  ('22222222-2222-2222-2222-222222222208', 110, 'Sampangirama Nagar', 'Central Zone', 12.9756, 77.6066)
ON CONFLICT (id) DO NOTHING;

-- 3. USERS (With passwords hashed with bcrypt: citizen123, officer123, worker123, admin123)
INSERT INTO users (id, user_code, password_hash, full_name, email, phone, role, department_id, address, ward_id, avatar_url, is_active, is_verified)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'CIT001', '$2b$10$Au37vdq8QQFsL5Brd5nMluBkZMJt6Q6M/qkQ24/nWwYlu9h5rZ5XO', 'Aarav Sharma', 'aarav.sharma@example.com', '+91 98450 12345', 'CITIZEN', NULL, '#142, 5th Cross, Indiranagar, Bengaluru - 560038', '22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160', TRUE, TRUE),
  ('33333333-3333-3333-3333-333333333302', 'OFF001', '$2b$10$Alll4W6A6.YprinANUiTHu6aTpX/cRUSnC5cR/AwhUm8vl/wxJBum', 'Rajesh Kulkarni', 'r.kulkarni@bbmp.gov.in', '+91 94480 88214', 'DEPARTMENT_OFFICER', '11111111-1111-1111-1111-111111111101', 'BBMP Zonal Office, Indiranagar, Bengaluru', '22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160', TRUE, TRUE),
  ('33333333-3333-3333-3333-333333333303', 'OFF002', '$2b$10$Alll4W6A6.YprinANUiTHu6aTpX/cRUSnC5cR/AwhUm8vl/wxJBum', 'Sunita Deshmukh', 's.deshmukh@bwssb.gov.in', '+91 94480 77190', 'DEPARTMENT_OFFICER', '11111111-1111-1111-1111-111111111102', 'BWSSB Sub-Division, Koramangala, Bengaluru', '22222222-2222-2222-2222-222222222202', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=160', TRUE, TRUE),
  ('33333333-3333-3333-3333-333333333304', 'WRK001', '$2b$10$Wd.CCH5CmZpXJAonGvXxB./cRfU0jaxdTf9bllD9iOq7Wve9GPeWS', 'Ramesh Nayak', 'ramesh.n@bbmp.gov.in', '+91 98860 44512', 'FIELD_WORKER', '11111111-1111-1111-1111-111111111101', 'Maintenance Depot #4, Ulsoor, Bengaluru', '22222222-2222-2222-2222-222222222201', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160', TRUE, TRUE),
  ('33333333-3333-3333-3333-333333333305', 'ADM001', '$2b$10$l6nJtCvJqHxJD7Av6H84guXEd5LwoDmanjBE.76J3eDbaZZ7t195y', 'Dr. Priya Sundaram', 'commissioner@bbmp.gov.in', '+91 94490 11000', 'SUPER_ADMIN', NULL, 'BBMP Head Office, Corporation Circle, Bengaluru', '22222222-2222-2222-2222-222222222208', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160', TRUE, TRUE),
  ('33333333-3333-3333-3333-333333333306', 'CIT002', '$2b$10$Au37vdq8QQFsL5Brd5nMluBkZMJt6Q6M/qkQ24/nWwYlu9h5rZ5XO', 'Meera Krishnan', 'meera.k@example.com', '+91 98451 98765', 'CITIZEN', NULL, '#22, 14th Main, HSR Layout Sector 3, Bengaluru', '22222222-2222-2222-2222-222222222203', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160', TRUE, TRUE),
  ('33333333-3333-3333-3333-333333333307', 'WRK002', '$2b$10$Wd.CCH5CmZpXJAonGvXxB./cRfU0jaxdTf9bllD9iOq7Wve9GPeWS', 'Santosh Kumar', 'santosh.k@bwssb.gov.in', '+91 98861 11209', 'FIELD_WORKER', '11111111-1111-1111-1111-111111111102', 'Depot #2, Koramangala', '22222222-2222-2222-2222-222222222202', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Link departments to head officers
UPDATE departments SET head_officer_id = '33333333-3333-3333-3333-333333333302' WHERE id = '11111111-1111-1111-1111-111111111101';
UPDATE departments SET head_officer_id = '33333333-3333-3333-3333-333333333303' WHERE id = '11111111-1111-1111-1111-111111111102';

-- 4. WORKER PROFILES
INSERT INTO worker_profiles (id, user_id, department_id, specializations, assigned_zone, rating, is_available)
VALUES
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111101', ARRAY['Asphalt Patching', 'Pothole Repair', 'Footpath Paving'], 'East Zone - Indiranagar', 4.80, TRUE),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111102', ARRAY['Pipeline Welding', 'Pressure Valve Tuning', 'Leakage Detection'], 'South Zone - Koramangala', 4.90, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. COMPLAINT CATEGORIES
INSERT INTO complaint_categories (id, name, default_department_id, description, is_active)
VALUES
  ('55555555-5555-5555-5555-555555555501', 'Roads & Infrastructure', '11111111-1111-1111-1111-111111111101', 'Potholes, broken roads, damaged footpaths and median dividers.', TRUE),
  ('55555555-5555-5555-5555-555555555502', 'Water Supply', '11111111-1111-1111-1111-111111111102', 'Pipe bursts, contaminated supply, low pressure, valve leaks.', TRUE),
  ('55555555-5555-5555-5555-555555555503', 'Sanitation & Solid Waste', '11111111-1111-1111-1111-111111111103', 'Garbage dumping, missing bins, rotting animal waste.', TRUE),
  ('55555555-5555-5555-5555-555555555504', 'Street Lighting', '11111111-1111-1111-1111-111111111104', 'Dark roads, flickering lights, exposed electrical wires.', TRUE),
  ('55555555-5555-5555-5555-555555555505', 'Drainage & Sewage', '11111111-1111-1111-1111-111111111105', 'Blocked drains, open manholes, sewage overflow into streets.', TRUE),
  ('55555555-5555-5555-5555-555555555506', 'Public Health', '11111111-1111-1111-1111-111111111106', 'Mosquito breeding, stray dog menace, public hygiene violations.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. SLA RULES
INSERT INTO sla_rules (id, department_id, category_id, ack_deadline_hours, assign_deadline_hours, inspection_deadline_hours, resolution_deadline_hours, is_active)
VALUES
  ('66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111101', '55555555-5555-5555-5555-555555555501', 6, 12, 24, 72, TRUE),
  ('66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111102', '55555555-5555-5555-5555-555555555502', 4, 8, 12, 48, TRUE),
  ('66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111103', '55555555-5555-5555-5555-555555555503', 4, 6, 12, 24, TRUE),
  ('66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111104', '55555555-5555-5555-5555-555555555504', 6, 12, 24, 48, TRUE),
  ('66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111105', '55555555-5555-5555-5555-555555555505', 6, 12, 18, 48, TRUE),
  ('66666666-6666-6666-6666-666666666606', '11111111-1111-1111-1111-111111111106', '55555555-5555-5555-5555-555555555506', 4, 8, 16, 36, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. INITIAL COMPLAINTS
INSERT INTO complaints (
  id, ticket_number, title, description, citizen_id, category_id, current_department_id,
  ward_id, street_location, landmark, latitude, longitude, priority, status,
  acknowledged_at, assigned_worker_id, assigned_at, inspection_completed_at, work_started_at,
  sla_ack_deadline, sla_assign_deadline, sla_inspection_deadline, sla_resolution_deadline,
  created_at, updated_at
)
VALUES
  (
    '77777777-7777-7777-7777-777777777701', 'BLR-2025-0101', 'Severe crater-like potholes on 100 Feet Road',
    'Two massive potholes in the center of the lane right before signal. Water is accumulating, invisible at night.',
    '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222201', 'Indiranagar 100 Feet Rd, near 12th Main', 'Near 12th Main Signal', 12.9719, 77.6412,
    'HIGH', 'WORK_IN_PROGRESS',
    NOW() - INTERVAL '2 days', '33333333-3333-3333-3333-333333333304', NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '12 hours',
    NOW() + INTERVAL '4 hours', NOW() + INTERVAL '10 hours', NOW() + INTERVAL '22 hours', NOW() + INTERVAL '70 hours',
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '12 hours'
  ),
  (
    '77777777-7777-7777-7777-777777777702', 'BLR-2025-0104', 'Footpath collapsed & paving stones removed due to trenching',
    'Pavement caved in. Originally reported to Water Supply, but pertains directly to Roads & Infrastructure division.',
    '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111101',
    '22222222-2222-2222-2222-222222222204', 'Jayanagar 4th Block, 9th Main', 'Opposite Post Office', 12.9299, 77.5824,
    'HIGH', 'TRANSFERRED',
    NULL, NULL, NULL, NULL, NULL,
    NOW() + INTERVAL '6 hours', NOW() + INTERVAL '12 hours', NOW() + INTERVAL '24 hours', NOW() + INTERVAL '72 hours',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours'
  ),
  (
    '77777777-7777-7777-7777-777777777703', 'BLR-2025-0106', 'Open stormwater drain slab missing — serious pedestrian fall hazard',
    'Reinforced concrete slab over 4-foot deep stormwater drain broken. Open pit with no warning barricade.',
    '33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555505', '11111111-1111-1111-1111-111111111105',
    '22222222-2222-2222-2222-222222222206', 'Malleshwaram 8th Cross', 'Near Margosa Road Junction', 13.0033, 77.5701,
    'CRITICAL', 'DISPUTED',
    NOW() - INTERVAL '4 days', NULL, NULL, NULL, NULL,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- 8. COMPLAINT SUPPORTERS
INSERT INTO complaint_supporters (id, complaint_id, citizen_id)
VALUES
  ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '33333333-3333-3333-3333-333333333301'),
  ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777701', '33333333-3333-3333-3333-333333333306')
ON CONFLICT (id) DO NOTHING;

-- 9. COMPLAINT EVIDENCE
INSERT INTO complaint_evidence (id, complaint_id, uploaded_by, file_url, file_name, file_size, mime_type, evidence_stage)
VALUES
  ('99999999-9999-9999-9999-999999999901', '77777777-7777-7777-7777-777777777701', '33333333-3333-3333-3333-333333333301', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800', 'pothole_initial.jpg', 245000, 'image/jpeg', 'CITIZEN_INITIAL'),
  ('99999999-9999-9999-9999-999999999902', '77777777-7777-7777-7777-777777777702', '33333333-3333-3333-3333-333333333301', 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800', 'caved_footpath.jpg', 189000, 'image/jpeg', 'CITIZEN_INITIAL')
ON CONFLICT (id) DO NOTHING;

-- 10. COMPLAINT STATUS HISTORY
INSERT INTO complaint_status_history (id, complaint_id, from_status, to_status, actor_id, title, notes, created_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '77777777-7777-7777-7777-777777777701', NULL, 'SUBMITTED', '33333333-3333-3333-3333-333333333301', 'Complaint Registered', 'Citizen Aarav Sharma registered the grievance.', NOW() - INTERVAL '2 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '77777777-7777-7777-7777-777777777701', 'SUBMITTED', 'ACKNOWLEDGED', '33333333-3333-3333-3333-333333333302', 'Complaint Acknowledged', 'Officer reviewed and set priority to HIGH.', NOW() - INTERVAL '2 days' + INTERVAL '2 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '77777777-7777-7777-7777-777777777701', 'ACKNOWLEDGED', 'WORKER_ASSIGNED', '33333333-3333-3333-3333-333333333302', 'Worker Assigned', 'Assigned to Ramesh Nayak for site inspection.', NOW() - INTERVAL '1 day'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '77777777-7777-7777-7777-777777777701', 'WORKER_ASSIGNED', 'WORK_IN_PROGRESS', '33333333-3333-3333-3333-333333333304', 'Work Commenced', 'Asphalt cold-mix patching underway.', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- 11. COMPLAINT TRANSFERS (Inter-department transfer audit record)
INSERT INTO complaint_transfers (id, complaint_id, from_department_id, to_department_id, transferred_by, transfer_number, reason, receiving_decision, created_at)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '77777777-7777-7777-7777-777777777702', '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333303', 1, 'Site inspection confirms optical fiber trenching damaged the pedestrian footpath, not water main. Pertains directly to Roads and Infrastructure.', 'PENDING', NOW() - INTERVAL '6 hours')
ON CONFLICT (id) DO NOTHING;

-- 12. ESCALATIONS (For BLR-2025-0106 disputed case)
INSERT INTO escalations (id, complaint_id, escalation_level, trigger_reason, overdue_hours, responsible_role, responsible_officer_id, status, admin_notes, escalated_at)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc1', '77777777-7777-7777-7777-777777777703', 2, 'Citizen disputed temporary plywood covering on drain slab as hazardous', 36, 'Department Supervisor', '33333333-3333-3333-3333-333333333302', 'OPEN', 'Awaiting senior engineer re-inspection order.', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 13. NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, complaint_id, type, is_read, created_at)
VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '33333333-3333-3333-3333-333333333301', 'Grievance Transferred', 'Your complaint BLR-2025-0104 was transferred from Water Supply to Roads & Infrastructure.', '77777777-7777-7777-7777-777777777702', 'TRANSFER', FALSE, NOW() - INTERVAL '6 hours'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', '33333333-3333-3333-3333-333333333302', 'Transfer Received: BLR-2025-0104', 'Transferred to Roads & Infrastructure from Water Supply. Reason: Trenching damage.', '77777777-7777-7777-7777-777777777702', 'TRANSFER', FALSE, NOW() - INTERVAL '6 hours'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd03', '33333333-3333-3333-3333-333333333304', 'Work Order Assigned: BLR-2025-0101', 'You have been assigned to repair severe pothole cluster at Indiranagar 100 Feet Road.', '77777777-7777-7777-7777-777777777701', 'ASSIGNMENT', FALSE, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

