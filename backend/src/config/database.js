import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool;

export function getDbConfig() {
  const isSsl = process.env.DATABASE_SSL === 'true';
  const ssl = isSsl ? { rejectUnauthorized: false } : false;

  // Option B: Individual connection parameters
  if (process.env.DB_HOST || process.env.DB_USER || process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : 'postgres',
      ssl
    };
  }

  // Fallback to DATABASE_URL if provided
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl
    };
  }

  // Default fallback
  return {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
    ssl
  };
}

export function getPool() {
  if (!pool) {
    const poolConfig = getDbConfig();

    pool = new Pool({
      ...poolConfig,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err.message);
    });
  }
  return pool;
}

export async function testConnection() {
  try {
    const currentPool = getPool();
    const res = await currentPool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`✅ Connected to PostgreSQL database '${res.rows[0].db_name}' at ${res.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    return false;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔒 PostgreSQL pool closed.');
  }
}

export async function query(text, params = []) {
  const currentPool = getPool();
  const start = Date.now();
  try {
    const res = await currentPool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log(`Executed query: ${text.slice(0, 80)}... Duration: ${duration}ms, Rows: ${res.rowCount}`);
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error.message, 'Query:', text, 'Params:', params);
    throw error;
  }
}

export async function withTransaction(callback) {
  const currentPool = getPool();
  const client = await currentPool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default {
  getDbConfig,
  getPool,
  testConnection,
  closePool,
  query,
  withTransaction
};
