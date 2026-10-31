import session from 'express-session';
import pgSimple from 'connect-pg-simple';
import { getPool } from './database.js';
import dotenv from 'dotenv';

dotenv.config();

const PgSession = pgSimple(session);

export function configureSession() {
  const pool = getPool();
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAgeDays = parseInt(process.env.SESSION_MAX_AGE_DAYS || '7', 10);

  let store;
  try {
    store = new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: false,
      pruneSessionInterval: 60 * 60,
      errorLog: (err) => {
        // Suppress session pool warnings to prevent breaking JWT-based requests
      }
    });
  } catch (err) {
    console.warn('PostgreSQL session store initialization fallback:', err.message);
    store = new session.MemoryStore();
  }

  return session({
    store,
    secret: process.env.SESSION_SECRET || 'nagrikseva_default_session_secret_key_2026',
    name: 'nagrikseva.sid',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh expiration on every response
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: maxAgeDays * 24 * 60 * 60 * 1000 // Convert days to milliseconds
    }
  });
}

export default configureSession;

