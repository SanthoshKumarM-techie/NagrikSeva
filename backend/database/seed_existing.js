import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { getDbConfig } from '../src/config/database.js';

dotenv.config();

const pool = new pg.Pool(getDbConfig());

export async function seedDatabase() {
  console.log('Seeding existing PostgreSQL tables in Supabase...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Departments
    console.log('Inserting departments...');
    const deptRows = [
      { id: '11111111-1111-1111-1111-111111111101', code: 'ROAD', name: 'Road Infrastructure & Maintenance', desc: 'Maintenance of asphalt roads, potholes, pedestrian paths, and storm drainage bridges.', email: 'roads@bbmp.gov.in', phone: '+91 80 2266 0001' },
      { id: '11111111-1111-1111-1111-111111111102', code: 'SWM', name: 'Solid Waste Management', desc: 'Garbage collection, illegal dumping removal, dry/wet waste segregation, and community dustbins.', email: 'swm@bbmp.gov.in', phone: '+91 80 2266 0002' },
      { id: '11111111-1111-1111-1111-111111111103', code: 'BWSSB', name: 'Water Supply & Sewerage Board', desc: 'Fresh drinking water pipelines, sewage overflows, open manholes, and underground drain blockages.', email: 'water@bbmp.gov.in', phone: '+91 80 2266 0003' },
      { id: '11111111-1111-1111-1111-111111111104', code: 'ELEC', name: 'Street Lighting & Electrical', desc: 'Public street illumination, solar lampposts, exposed underground cables, and timer repairs.', email: 'electrical@bbmp.gov.in', phone: '+91 80 2266 0004' }
    ];

    for (const d of deptRows) {
      await client.query(`
        INSERT INTO departments (id, code, name, description, contact_email, contact_phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        ON CONFLICT (id) DO NOTHING;
      `, [d.id, d.code, d.name, d.desc, d.email, d.phone]);
    }

    // 2. Municipal Wards
    console.log('Inserting municipal wards...');
    const wards = [
      { id: '22222222-2222-2222-2222-222222222201', num: '101', name: 'Indiranagar', zone: 'East Zone' },
      { id: '22222222-2222-2222-2222-222222222202', num: '102', name: 'Koramangala', zone: 'South Zone' },
      { id: '22222222-2222-2222-2222-222222222203', num: '103', name: 'HSR Layout', zone: 'South Zone' },
      { id: '22222222-2222-2222-2222-222222222204', num: '104', name: 'Whitefield', zone: 'East Zone' }
    ];

    for (const w of wards) {
      await client.query(`
        INSERT INTO municipal_wards (id, ward_number, name, zone_name, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (id) DO NOTHING;
      `, [w.id, w.num, w.name, w.zone]);
    }

    // 3. Complaint Categories
    console.log('Inserting complaint categories...');
    const categories = [
      { id: '33333333-3333-3333-3333-333333333301', name: 'Pothole on Main Road', deptId: deptRows[0].id, desc: 'Damage or deep crater in paved road asphalt surface' },
      { id: '33333333-3333-3333-3333-333333333302', name: 'Broken Footpath & Paver Blocks', deptId: deptRows[0].id, desc: 'Hazardous missing slabs or broken footpath pavers' },
      { id: '33333333-3333-3333-3333-333333333303', name: 'Garbage Dump Overflow', deptId: deptRows[1].id, desc: 'Uncollected community waste accumulating on roadside' },
      { id: '33333333-3333-3333-3333-333333333304', name: 'Drinking Water Pipe Leak', deptId: deptRows[2].id, desc: 'Pressurized water pipe rupture flooding streets' },
      { id: '33333333-3333-3333-3333-333333333305', name: 'Sewage Overflow on Street', deptId: deptRows[2].id, desc: 'Clogged manhole resulting in sewage backing up' },
      { id: '33333333-3333-3333-3333-333333333306', name: 'Non-Functional Streetlight', deptId: deptRows[3].id, desc: 'Street illumination light dead at night' }
    ];

    for (const c of categories) {
      await client.query(`
        INSERT INTO complaint_categories (id, name, description, default_department_id, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        ON CONFLICT (id) DO NOTHING;
      `, [c.id, c.name, c.desc, c.deptId]);
    }

    // 4. Users
    console.log('Inserting demo users...');
    const citizenHash = await bcrypt.hash('citizen123', 10);
    const officerHash = await bcrypt.hash('officer123', 10);
    const workerHash = await bcrypt.hash('worker123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    const users = [
      {
        id: '44444444-4444-4444-4444-444444444401',
        code: 'CIT001',
        name: 'Aarav Sharma',
        email: 'citizen@example.com',
        phone: '+91 98765 43210',
        role: 'CITIZEN',
        hash: citizenHash,
        deptId: null,
        wardId: wards[0].id
      },
      {
        id: '44444444-4444-4444-4444-444444444402',
        code: 'OFF001',
        name: 'Rajesh Kumar',
        email: 'officer@bbmp.gov.in',
        phone: '+91 98765 43211',
        role: 'DEPARTMENT_OFFICER',
        hash: officerHash,
        deptId: deptRows[0].id,
        wardId: wards[0].id
      },
      {
        id: '44444444-4444-4444-4444-444444444403',
        code: 'WRK001',
        name: 'Suresh Patil',
        email: 'worker@bbmp.gov.in',
        phone: '+91 98765 43212',
        role: 'FIELD_WORKER',
        hash: workerHash,
        deptId: deptRows[0].id,
        wardId: wards[0].id
      },
      {
        id: '44444444-4444-4444-4444-444444444404',
        code: 'ADM001',
        name: 'Priya Sundaram',
        email: 'admin@bbmp.gov.in',
        phone: '+91 98765 43213',
        role: 'SUPER_ADMIN',
        hash: adminHash,
        deptId: null,
        wardId: null
      },
      {
        id: '44444444-4444-4444-4444-444444444405',
        code: 'CIT002',
        name: 'Meera Krishnan',
        email: 'meera@example.com',
        phone: '+91 98765 43214',
        role: 'CITIZEN',
        hash: citizenHash,
        deptId: null,
        wardId: wards[1].id
      }
    ];

    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, user_code, full_name, email, phone, role, password_hash, department_id, ward_id, identity_verified, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, TRUE)
        ON CONFLICT (id) DO NOTHING;
      `, [u.id, u.code, u.name, u.email, u.phone, u.role, u.hash, u.deptId, u.wardId]);
    }

    // Worker profile
    console.log('Inserting worker profile...');
    await client.query(`
      INSERT INTO worker_profiles (user_id, assigned_zone, specializations, rating)
      VALUES ($1, 'East Zone', ARRAY['Pothole Patching', 'Asphalt Laying', 'Drain Slabs'], 4.85)
      ON CONFLICT (user_id) DO NOTHING;
    `, [users[2].id]);

    // 5. SLA Rules
    console.log('Inserting SLA rules...');
    const slaRules = [
      { deptId: deptRows[0].id, ack: 4, assign: 12, insp: 24, res: 48 },
      { deptId: deptRows[1].id, ack: 2, assign: 6, insp: 12, res: 24 },
      { deptId: deptRows[2].id, ack: 4, assign: 8, insp: 16, res: 36 },
      { deptId: deptRows[3].id, ack: 6, assign: 12, insp: 24, res: 72 }
    ];

    for (const s of slaRules) {
      await client.query(`
        INSERT INTO sla_rules (department_id, acknowledgement_hours, assignment_hours, inspection_hours, resolution_hours, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE);
      `, [s.deptId, s.ack, s.assign, s.insp, s.res]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed data successfully populated in Supabase!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message || err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === import.meta.url || process.argv[1].endsWith('seed_existing.js')) {
  seedDatabase().catch(() => process.exit(1));
}

