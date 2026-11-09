import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Client } = pg;

async function syncCredentials() {
  const isSsl = process.env.DATABASE_SSL === 'true';
  const ssl = isSsl ? { rejectUnauthorized: false } : false;

  const client = new Client({
    host: process.env.DB_HOST || 'aws-1-eu-west-3.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres.ikrdqbyrgzhjslnbqzqy',
    password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : 'NagrikSeva123',
    ssl
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL to sync role credentials...');

    const passHash = await bcrypt.hash('pass123', 10);
    const PRIMARY_DEPT_ID = '11111111-1111-1111-1111-111111111101';

    // Update primary 01 accounts
    await client.query(`
      UPDATE users 
      SET user_code = 'admin01', email = 'admin01@bbmp.gov.in', password_hash = $1, is_active = TRUE, identity_verified = TRUE
      WHERE role = 'SUPER_ADMIN' AND (user_code = 'ADM001' OR user_code = 'admin01' OR email LIKE 'admin%');
    `, [passHash]);

    await client.query(`
      UPDATE users 
      SET user_code = 'officer01', email = 'officer01@bbmp.gov.in', password_hash = $1, department_id = $2, is_active = TRUE, identity_verified = TRUE
      WHERE role = 'DEPARTMENT_OFFICER' AND (user_code = 'OFF001' OR user_code = 'officer01' OR email LIKE 'officer%');
    `, [passHash, PRIMARY_DEPT_ID]);

    await client.query(`
      UPDATE users 
      SET user_code = 'contractor01', email = 'contractor01@bbmp.gov.in', password_hash = $1, department_id = $2, is_active = TRUE, identity_verified = TRUE
      WHERE role = 'FIELD_WORKER' AND (user_code = 'WRK001' OR user_code = 'contractor01' OR user_code = 'worker01' OR email LIKE 'worker%' OR email LIKE 'contractor%');
    `, [passHash, PRIMARY_DEPT_ID]);

    await client.query(`
      UPDATE users 
      SET user_code = 'citizen01', email = 'citizen01@example.com', password_hash = $1, is_active = TRUE, identity_verified = TRUE
      WHERE role = 'CITIZEN' AND (user_code = 'CIT001' OR user_code = 'citizen01' OR email = 'citizen@example.com');
    `, [passHash]);

    // Insert 02 accounts if not present
    await client.query(`
      INSERT INTO users (id, user_code, full_name, email, phone, role, password_hash, is_active, identity_verified)
      VALUES ('44444444-4444-4444-4444-444444444414', 'admin02', 'Anand Murthy', 'admin02@bbmp.gov.in', '+91 80 2266 0013', 'SUPER_ADMIN', $1, TRUE, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [passHash]);

    await client.query(`
      INSERT INTO users (id, user_code, full_name, email, phone, role, password_hash, department_id, is_active, identity_verified)
      VALUES ('44444444-4444-4444-4444-444444444412', 'officer02', 'Sunita Deshmukh', 'officer02@bbmp.gov.in', '+91 80 2266 0011', 'DEPARTMENT_OFFICER', $2, $1, TRUE, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [passHash, PRIMARY_DEPT_ID]);

    await client.query(`
      INSERT INTO users (id, user_code, full_name, email, phone, role, password_hash, department_id, is_active, identity_verified)
      VALUES ('44444444-4444-4444-4444-444444444413', 'contractor02', 'Kiran Gowda', 'contractor02@bbmp.gov.in', '+91 80 2266 0012', 'FIELD_WORKER', $2, $1, TRUE, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [passHash, PRIMARY_DEPT_ID]);

    await client.query(`
      INSERT INTO users (id, user_code, full_name, email, phone, role, password_hash, is_active, identity_verified)
      VALUES ('44444444-4444-4444-4444-444444444411', 'citizen02', 'Meera Krishnan', 'citizen02@example.com', '+91 98450 12346', 'CITIZEN', $1, TRUE, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [passHash]);

    console.log('✅ Role credentials synced to PostgreSQL successfully!');
    await client.end();
  } catch (err) {
    console.log('Database not reachable or offline; built-in auth layer will handle logins:', err.message);
  }
}

syncCredentials();
