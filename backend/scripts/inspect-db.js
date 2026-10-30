import 'dotenv/config';
import db from '../src/config/database.js';

async function check() {
  const indexes = await db.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'worker_assignments'
  `);
  console.log('worker_assignments indexes:', indexes.rows);

  const constraints = await db.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'worker_assignments'
  `);
  console.log('worker_assignments constraints:', constraints.rows);

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });

